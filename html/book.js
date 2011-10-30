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
       $('#result').removeClass('finished');
       
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