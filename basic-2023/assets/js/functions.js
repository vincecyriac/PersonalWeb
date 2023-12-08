"use strict";
var m, divId, initLatitude, initLongitude, map, $body = $("body");
$(window).on("load", function() {
    $body.addClass("loaded")
}), "true" === $body.attr("data-preloader") && $body.append($("<div class='preloader'><div><span>V</span><span>I</span><span>N</span><span>C</span><span>E</span></div></div>")), $("a[href^=\\#]").on("click", function(e) {
    e.preventDefault(), $("html,body").animate({
        scrollTop: $(this.hash).offset().top + -24
    }, 0)
});
var toggleMenu = $(".toggle-menu");
if (toggleMenu.length) {
    var e = $(".menu-dots"),
        a = $(".toggle-close");
    e.on("click", function() {
        toggleMenu.hasClass("show") ? (toggleMenu.removeClass("show"), e.removeClass("active")) : (toggleMenu.addClass("show"), e.addClass("active"))
    }), a.on("click", function() {
        toggleMenu.removeClass("show"), e.removeClass("active")
    }), $(document).on("click", function(a) {
        0 === $(a.target).closest(".toggle-menu, .menu-dots").length && toggleMenu.hasClass("show") && (toggleMenu.removeClass("show"), e.removeClass("active"))
    })
}
var windowWidth = window.innerWidth,
    headerHeight = document.getElementById("header").offsetHeight,
    sectionNav = document.querySelector(".section-nav");
windowWidth < 992 && window.addEventListener("scroll", function() {
    window.scrollY >= headerHeight ? sectionNav.classList.add("fixed") : sectionNav.classList.remove("fixed")
});
var bgImages = document.querySelectorAll(".bg-image");
bgImages && bgImages.forEach(function(e) {
    var a = e.getAttribute("data-bg-src");
    e.style.backgroundImage = 'url("' + a + '")'
});