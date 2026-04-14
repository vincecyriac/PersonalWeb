$(document).ready(function() {
    var cursor = $('<div class="cursor"></div>');
    var cursorFollower = $('<div class="cursor-follower"></div>');
    
    $('body').append(cursor);
    $('body').append(cursorFollower);
    
    var posX = 0, posY = 0, mouseX = 0, mouseY = 0;
    
    TweenMax.to({}, 0.016, {
        repeat: -1,
        onRepeat: function() {
            posX += (mouseX - posX) / 9;
            posY += (mouseY - posY) / 9;
            
            TweenMax.set(cursorFollower, {
                css: {
                    left: posX - 12,
                    top: posY - 12
                }
            });
            
            TweenMax.set(cursor, {
                css: {
                    left: mouseX,
                    top: mouseY
                }
            });
        }
    });
    
    $(document).on('mousemove', function(e) {
        mouseX = e.clientX;
        mouseY = e.clientY;
    });
    
    $('a, button, .button, .nav-link, .service-item, .project-item').on('mouseenter', function() {
        cursor.addClass('active');
        cursorFollower.addClass('active');
    });
    
    $('a, button, .button, .nav-link, .service-item, .project-item').on('mouseleave', function() {
        cursor.removeClass('active');
        cursorFollower.removeClass('active');
    });
});
