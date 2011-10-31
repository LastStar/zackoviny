$(document).ready(function(){

    // Temporary debug function.
    function log(obj) {
        var text = '';

        if (typeof obj == 'object') {
            for (var item in obj) {
                text += item + '; ';
            }
        } else {
            text = obj;
        }
        
        $('#debug').text($('#debug').text() + text);
    }
    
    /*
    ----------------------------------------
        Matching stuff
    ----------------------------------------
    */
    
    var canvas = document.getElementById('canvas');
    
    if (canvas) {
        var image = new Image(),
            secondImageOffset = 334,
            tapEvent = undefined,
            canvasContext = canvas.getContext('2d'),        
            canvasFrame = {
                origin: {
                    x: canvas.offsetLeft,
                    y: canvas.offsetTop
                },
                size: {
                    width: canvas.width,
                    height: canvas.height
                }
            };

        // Add load event for image to load it into the canvas.
        image.addEventListener('load', function() {
            canvasContext.drawImage(image, 0, 0, image.width, image.height);
        }, false);
        image.src = 'matches.png';
    }     
        
    // Items coordinates.
    var items = [
        {selected:false,rgb:'255,0,0',x1:20,y1:40,x2:70,y2:70},
        {selected:false,rgb:'255,0,0',x1:5,y1:160,x2:145,y2:230},
        {selected:false,rgb:'255,0,0',x1:145,y1:370,x2:220,y2:422},
        {selected:false,rgb:'255,0,0',x1:255,y1:101,x2:315,y2:212},
        {selected:false,rgb:'255,0,0',x1:185,y1:230,x2:230,y2:266},
        {selected:false,rgb:'255,0,0',x1:138,y1:5,x2:180,y2:69},
        {selected:false,rgb:'255,0,0',x1:170,y1:275,x2:200,y2:305}
    ];
    
    // Debug functions to snapshow rect for the tap area.
    var initialDebugPoint = { };

    $('#canvas').bind('mousedown', function(event) {
        initialDebugPoint = {
            x: event.pageX - canvasFrame.origin.x,
            y: event.pageY - canvasFrame.origin.y
        };
    });

    $('#canvas').bind('mouseup', function(event) {
        var x1 = initialDebugPoint.x,
            y1 = initialDebugPoint.y,
            x2 = event.pageX - canvasFrame.origin.x,
            y2 = event.pageY - canvasFrame.origin.y;
        
        log('{x1:' + x1 + ',y1:' + y1 + ',x2:' + x2 + ',y2:' + y2 + '} ');
    });
    
    // Simulate delayless tap.
    if (canvas) {
        canvas.addEventListener('click', function() {

        }, false);
        canvas.addEventListener('touchstart', function(event) {
            tapEvent = event;
        }, false);
        
        canvas.addEventListener('touchmove', function(event) {
            tapEvent = undefined;
        }, false);

        canvas.addEventListener('touchend', function(event) {
            if (tapEvent !== undefined) {
                checkMatches(tapEvent);
            }
        }, false);
    }
    
    // Check correct places for the matches on tap.
    function checkMatches(event) {
        var found = false,
            tp = {
                x: event.pageX - canvasFrame.origin.x,
                y: event.pageY - canvasFrame.origin.y
            };
        
        for (var i = 0, len = items.length; i < len; i++) {
            var obj = items[i];

            if (((tp.x >= obj.x1 && tp.x <= obj.x2) || (tp.x >= obj.x1 + secondImageOffset && tp.x <= obj.x2 + secondImageOffset)) 
                && tp.y >= obj.y1 && tp.y <= obj.y2 && obj.selected == false) {
                var width = obj.x2 - obj.x1,
                    height = obj.y2 - obj.y1,
                    x = obj.x1 + width / 2,
                    y = obj.y1 + height / 2;
                
                items[i].selected = true;
                found = true;
                
                drawEllipse(x, y, width, height, obj.rgb);
                drawEllipse(x + secondImageOffset, y, width, height, obj.rgb);
                break;
            }
        }
        
        $('#result').removeClass('wrong').removeClass('right').addClass((found === false) ? 'wrong' : 'right');
    }
    
    // Elipse drawing to check images.
    function drawEllipse(centerX, centerY, width, height, color) {
        canvasContext.beginPath();
        
        canvasContext.moveTo(centerX, centerY - height/2); // A1

        canvasContext.bezierCurveTo(
            centerX + width/2, centerY - height/2, // C1
            centerX + width/2, centerY + height/2, // C2
            centerX, centerY + height/2 // A2
        );

        canvasContext.bezierCurveTo(
            centerX - width/2, centerY + height/2, // C3
            centerX - width/2, centerY - height/2, // C4
            centerX, centerY - height/2 // A1
        );

        canvasContext.closePath(); 
        canvasContext.lineWidth = 2;
        canvasContext.shadowOffsetX = 0;
        canvasContext.shadowOffsetY = 0;
        canvasContext.shadowBlur = 5;
        canvasContext.shadowColor = "rgb(0,0,0)";
        canvasContext.strokeStyle = "rgba(" + color + ",0.8)";
        canvasContext.fillStyle = "rgba(" + color + ",0.5)";
        canvasContext.fill();
        canvasContext.stroke();
    }
    
    /*
    ----------------------------------------
        Dragging stuff
    ----------------------------------------
    */
    
    var answer = {
        node: undefined,
        startPoint: { },
        difference: { }
    };
    
    var question = [];
    
    // Assign each answer to drag cycle on touch start.
    $('.answer').each(function() {
        var node = $(this).get(0);

        node.addEventListener('touchstart', function(event) {
            var touch = event.touches[0];

            if ($(node).hasClass('pinned')) {
                return;
            }
            
            $(node).css('z-index', 100);
            answer.node = node;
            answer.startPoint = { x: parseFloat($(node).css('left')), y: parseFloat($(node).css('top')) };
            answer.difference = { x: answer.startPoint.x - touch.pageX, y: answer.startPoint.y - touch.pageY };
        }, false);
    });
    
    // Calculate drop area positions.
    $('.riddle li').each(function(key) {    
        var node = $(this).get(0);

        question.push({
            node: node,
            contains: 0,
            requires: 'answer' + (key+1),
            finished: false,
            origin: {
                x: node.offsetLeft,
                y: node.offsetTop
            },
            size: {
                width: document.width,
                height: 112
            }
        });           
    });
    
    // Draging for answer image.
    document.addEventListener('touchmove', function(event) {
        if (!answer.node) {
            return;
        }
        
        // Disable safari viewport drag.
        event.preventDefault();
        
        var touch = event.touches[0],
            touchPoint = { x: touch.pageX, y: touch.pageY },
            set = [];

        // Calculate touch-drag offset to avoid twich on initial touch.
        var x = touchPoint.x + answer.difference.x,
            y = touchPoint.y + answer.difference.y;

        // Set new image position under drag.
        answer.node.style.top = y + 'px'
        answer.node.style.left = x + 'px';
        
        // Select all drop areas where is image partially located.
        for (var i = 0; i < question.length; i++) {
            var q = question[i],
                qY1 = q.origin.y,
                qY2 = q.origin.y + q.size.height,
                aY1 = y,
                aY2 = y + answer.node.height;

            if ((qY1 >= aY1 && qY1 <= aY2) || (qY2 <= aY2 && qY2 >= aY1) || (qY1 <= aY1 && qY2 >= aY2)) {

                // Calculate partial containment of dragged image for each drop area.
                if (qY1 >= aY1 && qY1 <= aY2) {
                    q.contains = (answer.node.height - Math.abs(qY1 - aY1)) / answer.node.height;
                } else if (qY2 <= aY2 && qY2 >= aY1) {
                    q.contains = (answer.node.height - Math.abs(qY2 - aY2)) / answer.node.height;
                } else if (qY1 <= aY1 && qY2 >= aY2) {
                    q.contains = 1;
                }

                set.push(q)
            } else {
                $(q.node).removeClass('above');
            }
        }
        
        // Sort all drop areas by their image percentage containment.
        if (set.length > 0) {

            // Sort them by contains property.
            set.sort(function(a, b){
                return a.contains - b.contains;
            });
            set.reverse();
            
            // Set the first one to match our needs.
            $(set[0].node).addClass('above');
            
            // Reset remaining areas which does not fulfill our needs.
            for (var i = 1; i < set.length; i++) {
                var q = set[i];
                $(q.node).removeClass('above')
                q.contains = 0;
            }
        }
        
        var top = parseFloat(node.style.top),
            left = parseFloat(node.style.left);
        
    }, false);

    // Drag finished, consider outcome.
    document.addEventListener('touchend', touchEnd, false);
    document.addEventListener('touchcancel', touchEnd, false);
    
    // Consideration function.
    function touchEnd(event) {
        if (!answer.node) {
            return;
        }
        
        // Disable safari click.
        event.preventDefault();
        
        // Sort question by contain relevence.
        question.sort(function(a, b){
            return a.contains - b.contains;
        });
        question.reverse();

        // Set answer to be animated back thru css3.
        $(answer.node).addClass('animate');
        
        // Remove animated transition and check if its finished on completion.
        (function(node) {
            setTimeout(function() {
                $(node).removeClass('animate');
                
                var finished = true;
                for (var i = 0; i < question.length; i++) {
                    if (question[i].finished === false) {
                        finished = false;
                    }
                }

                if (finished === true) {
                    $('#result').addClass('finished');
                }
            }, 600);
        })(answer.node);
        
        // Answer is on the right place, animate it to the right direction and block its change.
        if (question[0].contains > 0 && question[0].requires == answer.node.id) {
            
            var w = parseFloat($(answer.node).css('width')),
                h = parseFloat($(answer.node).css('height')),
                scaledH = (100 / w) * h
                y = (question[0].origin.y + question[0].size.height / 2) - scaledH / 2,
                x = 610;
                
            answer.node.style.top = y + 'px';
            answer.node.style.left = x + 'px'
            $(answer.node).css('width', '100px').css('height', scaledH + 'px').addClass('pinned');
            $(question[0].node).addClass('complete').removeClass('above');
            question[0].finished = true;
            
        // Answer is on the wrong place, return in back where it comes from.
        } else {
            answer.node.style.top = answer.startPoint.y + 'px';
            answer.node.style.left = answer.startPoint.x + 'px'
            $(question[0].node).removeClass('above');
        }

        // Reset answer element, asnwer container and question relevance.
        for (var i = 0; i < question.length; i++) {
            question[i].contains = 0;
        }
        
        $(answer.node).css('z-index', 10);
        
        answer = {
            node: undefined,
            startPoint: { },
            startPosition: { }
        };
    }
   
   /*
   ----------------------------------------
       Menu Items
   ----------------------------------------
   */

   // Anchor correct highlight behaviour.
   $('.menu a').bind('touchstart', function() {
       $(this).addClass('highlight');
   });
   
   $('.menu a').bind('touchend touchcancel', function() {
       $(this).removeClass('highlight');
   });
   
   // Functionality for navigation links.
   document.getElementById('howto').addEventListener('click', function(event) {
       event.preventDefault();
       alert('Content should appear.');        
   }, false);
   
   document.getElementById('help').addEventListener('click', function(event) {
       event.preventDefault();
       alert('Content should appear.');        
   }, false);
   
   document.getElementById('reset').addEventListener('click', function(event) {
       event.preventDefault();
       
       // Remove green cloud.
       $('#result').removeClass('finished').removeClass('right').removeClass('wrong');
      
       // Reset canvas.
       if (canvas) {
           canvas.width = canvas.width;

           var refreshImage = new Image();
           refreshImage.addEventListener('load', function() {
               canvasContext.drawImage(image, 0, 0, image.width, image.height);
           }, false);
           refreshImage.src = 'matches.png';
           
           for (var i = 0, len = items.length; i < len; i++) {
               items[i].selected = false;
           }
       }
       
       // Reset answers and questions.
       $('.answer').each(function() {
           $(this).removeClass('pinned').attr('style', '');
       });

       for (var i = 0; i < question.length; i++) {
           $(question[i].node).removeClass('complete');
           question[i].finished = false;
       }
   }, false);    
   
});