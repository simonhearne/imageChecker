function getCumulativeOffset(obj) {
    var left, top;
    left = top = 0;
    if (obj.offsetParent) {
        do {
            left += obj.offsetLeft;
            top  += obj.offsetTop;
        } while (obj = obj.offsetParent);
    }
    return {
        left: left,
        top: top,
    };
}
function dimBackground() {
	var el = document.createElement('div');
	el.className = 'imageEfficiency';
	el.style.cssText = "position:absolute;top:0px;left:0px;background:black;width:100%;height:"+h+"px;opacity:0.5;z-index:2000";
	document.body.appendChild(el);
}
function findImages() {
	dimBackground();
    var aElems = document.getElementsByTagName('*');
    var re = /url\(("?http.*"?)\)/ig;
    for ( var i=0, len = aElems.length; i < len; i++ ) {
        var elem = aElems[i];
        var style = window.getComputedStyle(elem);
        var url = elem.src || elem.href;
        var hasImage = 0;
        var fixed = 0;
        var body = 0;
        re.lastIndex = 0; // reset state of regex so we catch repeating spritesheet elements
        if(elem.tagName == 'IMG') {
            hasImage = 1;
        }
        if(style['backgroundImage']) {
            var backgroundImage = style['backgroundImage'];
            var matches = re.exec(style['backgroundImage']);
            if (matches && matches.length > 1){
                url = backgroundImage.substring(4);
                url = url.substring(0, url.length - 1);
                url = url.replace(/"/, "");
                url = url.replace(/"/, "");
                hasImage = 1;
                if(elem.tagName == 'BODY'){
                    body = 1;
                }
            }
        }
        if(style['visibility'] == "hidden") {
            hasImage = 0;
        }
        if(hasImage == 1){
            if ( url ) {
                var entry = performance.getEntriesByName(url)[0];
                if ( entry ) {
                    var xy = getCumulativeOffset(elem);
                    var wh = elem.getBoundingClientRect();
                    var width = wh.width;
                    var height = wh.height;
					var naturalWidth = elem.naturalWidth;
					var naturalHeight = elem.naturalHeight;
					//console.log(naturalWidth);
					if ( typeof naturalWidth == 'undefined' || !naturalWidth ) {
						console.log("HERE");
						/* probably a background image */
						var img = document.createElement('img');
						img.src=url;
						img.style.cssText = ";visibility:hidden;display:none;";
						document.body.appendChild(img);
						naturalWidth = img.naturalWidth;
						naturalHeight = img.naturalHeight;
					}
                    if(width > 10 && height > 10){
                        if(naturalWidth > 10 && naturalHeight > 10){
							images.push([url,width]);
                            placeMarker(xy, width, height, naturalWidth, naturalHeight, entry, body, url);
                        }
                    }
                }
            }
        }
    }
	console.log(wastedPixels);
}
function colourFromEfficiency(eff) {
	var color;
	if (eff>2) h = 0;
	else if (eff<1) h=eff*.33;
	else h = (2 - eff)*.33;
	//console.log("Hue = "+h);
	h *= 360;
	return "hsl("+h+",100%,50%)";
}
function placeMarker(xy, width, height, naturalWidth, naturalHeight, entry, body, url) {
	var eff = (width*height)/(naturalWidth*naturalHeight);
	extraPixels = (naturalWidth*naturalHeight - width*height);
	if (extraPixels > 1) wastedPixels += extraPixels;
	//console.log(extraPixels,wastedPixels);
	//console.log("efficiency: " + eff);
	var filename = url.split('/');
	filename = filename[filename.length-1];
	
	var entry = performance.getEntriesByName(url)[0];
	size = false;
	if (entry.transferSize) {
		size = Math.floor(entry.transferSize / 1000);
		totalSize += entry.transferSize;
	}
	
	var el = document.createElement('div');
	align="center";
	lineheight = 16;
	
	if (eff>0 && eff<1000) {
		background=colourFromEfficiency(eff);
	} else {
		background="yellow";
	}
	var sizeText = "";
	if (size) sizeText = "<strong>"+size+"kB</strong> ";
	text = "This "+sizeText+"image (<a target='_blank' href='"+url+"'>"+filename+"</a>) is <strong>";
	if (size) title = "This "+size+"kB image ("+filename+") is ";
	else title = "This image ("+filename+") is ";
	if (eff<0.9) {
		var tooBig = Math.round((naturalWidth/width)*10)/10;
		text+=tooBig+"x too big";
		title+=tooBig+"x too big";
	}
	if (eff>1.1) {
		var tooSmall = Math.round(10/(naturalWidth/width)*10)/100;
		text+=tooSmall+"x too small";
		title+=tooSmall+"x too small";
	}
	else if (eff>0.9 && eff <1.1){
		text+="being served at the correct size";
		title+="being served at the correct size";
	}
	text += "</strong><br/>Displayed at "+width+"x"+height+".<br/>Served at "+naturalWidth+"x"+naturalHeight;
	title += ".\nDisplayed at "+width+"x"+height+".\nServed at "+naturalWidth+"x"+naturalHeight;
	if (width > 100 && height > 100) {
		el.innerHTML = text;
	}
	el.title = title;
	opacity=0.8;
	position="absolute";
	size="16px";
	pad = Math.floor((height - (lineheight*3))/2);
	
	el.className="imageEfficiency";
	el.setAttribute('src-image',url);
	el.style.cssText = "position:absolute; transition: 0.5s ease-in-out; box-sizing: border-box; background: "+background+"; color: #000; padding-left:10px; padding-right:10px; line-height: " + lineheight + "px; font-size: " + size + "px; font-family:\"Helvetica Neue\",sans-serif; text-align:" + align + "; opacity: " + opacity + "; top: " + xy.top + "px; left: " + xy.left + "px; width: " + width + "px; height:" + height + "px; padding-top: " + pad + "px; z-index: 4000; border: 1px solid black;";
	document.getElementsByTagName('body')[0].appendChild(el);
}
function kill() {
	var elements = document.getElementsByClassName('imageEfficiency');
    while(elements.length > 0){
        elements[0].parentNode.removeChild(elements[0]);
    }
}
function timebar() {
	var el = document.createElement('div');
	el.className = "imageEfficiency";
	el.style.cssText = ";position:fixed;top:0px;right:0px;width:400px;height:180px;background:rgba(255,255,255,0.9);z-index:5000;padding:10px;text-align:center;font-family:sans-serif !IMPORTANT;color:black !IMPORTANT;";
	wastedPixels = Math.floor(wastedPixels/1000)/1000;
	el.innerHTML = "<h1>Image Efficiency</h1><p>There are "+wastedPixels+" million wasted image pixels in this page!</p>";
	if (totalSize > 0) el.innerHTML += "<p>Total size of images = "+Math.floor(totalSize/1000)+"kB</p>";
	el.innerHTML+="<p>Click here to dismiss.</p>";
	el.onclick = function(){kill();};
	document.body.appendChild(el);
}
function s2b() {
	window.scrollTo(0,0); // reset screen position
	sh = Math.max(document.documentElement.clientHeight, window.innerHeight || 0);
	h = Math.max(document.body.offsetHeight,document.body.scrollHeight) - sh;
	chunk = 200; // scrollwheel distance?
	count=0;
	sl();
}
function sl() {
	window.scrollBy(0,chunk);
	count += chunk;
	if (count >= h) {
		window.scrollTo(0,0);
		findImages();
		timebar();
	} else {
		window.requestAnimationFrame(sl);
	}
}
function getSmallImages() {
	newImages = [];
	images.forEach(function(image) {
		var newImage = "http://llpc.lite-miss.imgeng.in/w_"+image[1]+"/"+image[0];
		console.log(newImage);
		var img = document.createElement('img');
		img.src = newImage;
		img.style.cssText = ";visibility:hidden;display:none;";
		document.body.appendChild(img);
		var entry = performance.getEntriesByName(image[0])[0];
		size = 0;
		if (entry.transferSize) {
			size = entry.transferSize;
		}
		newImages.push([image,newImage,size]);
	});
	setTimeout(getSmallImageSizes,1000);
}
function getSmallImageSizes() {
	newImages.forEach(function(image) {
		var entry = performance.getEntriesByName(image[1])[0];
		if (entry) {
			size = 0;
			if (entry.transferSize) {
				size = entry.transferSize;
			}
			newImageSizes.push([image[0],image[1],image[2],size]);
		}
	});
}
kill();
totalSize = 0;
wastedPixels = 0;
images=[];
newImageSizes = [];
s2b();
//getSmallImages();