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

// Dynamic Data Loading
$(document).ready(function() {
    // Weekend Mode Logic
    const isWeekend = () => {
        const day = new Date().getDay();
        return day === 0 || day === 6; // 0 is Sunday, 6 is Saturday
    };

    const toggleMode = (forceWeekend = false) => {
        const body = $('body');
        const weekdayContainer = $('#weekday-mode');
        const weekendContainer = $('#weekend-mode');
        const toggleBtn = $('#mode-toggle');
        const toggleIcon = toggleBtn.find('.toggle-icon i');
        const toggleText = toggleBtn.find('.toggle-text-desktop');

        if (forceWeekend || body.hasClass('weekend-mode')) {
            // Switch to Weekday
            if (!forceWeekend) {
                body.removeClass('weekend-mode');
                weekdayContainer.fadeIn();
                weekendContainer.hide();
                toggleIcon.removeClass('bi-toggle-on').addClass('bi-toggle-off');
                toggleText.text('Weekend Mode');
                reinitScrollSpy();
            } else {
                // Force Weekend (Initial Load)
                body.addClass('weekend-mode');
                weekdayContainer.hide();
                weekendContainer.fadeIn();
                toggleIcon.removeClass('bi-toggle-off').addClass('bi-toggle-on');
                toggleText.text('Weekday Mode');
            }
        } else {
            // Switch to Weekend
            body.addClass('weekend-mode');
            weekdayContainer.hide();
            weekendContainer.fadeIn();
            toggleIcon.removeClass('bi-toggle-off').addClass('bi-toggle-on');
            toggleText.text('Weekday Mode');
        }
    };

    // Initialize Mode
    if (isWeekend()) {
        toggleMode(true);
    }

    // Toggle Button Click
    $('#mode-toggle').on('click', function() {
        toggleMode();
    });

    // Fetch Data
    $.getJSON('assets/data/data.json', function(data) {
        renderProfile(data.profile);
        renderAbout(data.about);
        renderStats(data.stats, data.profile.startDate);
        renderServices(data.services);
        renderResume(data.resume);
        renderSkills(data.skills);
        renderProjects(data.projects);
        renderContact(data.contact);
        renderWeekend(data.weekend);
        
        // Initialize Bootstrap ScrollSpy after content is loaded
        setTimeout(function() {
            if (typeof bootstrap !== 'undefined') {
                new bootstrap.ScrollSpy(document.body, {
                    target: '.section-nav'
                });
            }
        }, 500);
        
        // Re-initialize plugins if needed (like typer)
        // Note: Typer might need re-init if it scans DOM on load. 
        // Since we update attributes, we might need to trigger it manually or let it handle it if it observes changes.
        // Looking at existing code, typer seems to be handled by plugins.js or similar. 
        // If it doesn't work, we might need to manually init it.
        // For now, let's assume updating attributes before it runs (or re-running it) works.
        // Actually, since we are inside $(document).ready and getting JSON is async, 
        // the initial page load might have already triggered plugins.
        // We might need to re-trigger typer.
    });
});

function renderProfile(profile) {
    $('#profile-name').html(`Vince <span class="stroke-text">${profile.surname}</span>`);
    $('#profile-avatar').attr('src', profile.avatar);
    
    // Custom Typer Init
    const words = profile.typerText.split(',').map(w => w.trim());
    initTyper('profile-typer', words);
    
    $('#resume-button').attr('href', profile.resumeLink);
    
    // Add LinkedIn link if available
    if (profile.socials?.linkedin) {
        // Wrap the resume button in a flex container if not already wrapped
        if (!$('#resume-button').parent().hasClass('social-links-container')) {
            $('#resume-button').wrap('<div class="social-links-container d-flex align-items-center gap-3 mt-4"></div>');
        }
        
        const linkedinHtml = `
            <a href="${profile.socials.linkedin}" target="_blank" class="social-link-weekday">
                <i class="bi bi-linkedin"></i>
            </a>
        `;
        $('#resume-button').parent().append(linkedinHtml);
    }
}

function initTyper(elementId, words) {
    const element = document.getElementById(elementId);
    if (!element) return;
    
    let wordIndex = 0;
    let charIndex = 0;
    let isDeleting = false;
    
    function type() {
        const currentWord = words[wordIndex];
        let typeSpeed = 100;
        
        if (isDeleting) {
            element.textContent = currentWord.substring(0, charIndex - 1);
            charIndex--;
            typeSpeed = 50;
        } else {
            element.textContent = currentWord.substring(0, charIndex + 1);
            charIndex++;
            typeSpeed = 100;
        }
        
        if (!isDeleting && charIndex === currentWord.length) {
            isDeleting = true;
            typeSpeed = 2000; // Pause at end
        } else if (isDeleting && charIndex === 0) {
            isDeleting = false;
            wordIndex = (wordIndex + 1) % words.length;
            typeSpeed = 500; // Pause before new word
        }
        
        setTimeout(type, typeSpeed);
    }
    
    type();
}

function renderAbout(about) {
    $('#about-title').text(about.title);
    $('#about-heading').text(about.heading);
    $('#about-description').text(about.description);
}

function renderStats(stats, startDate) {
    const statsRow = $('#stats-row');
    let html = '';
    
    stats.forEach(stat => {
        let value = stat.value;
        
        // Calculate experience if it's the experience counter
        if (stat.id === 'experience-counter' && startDate) {
            const start = new Date(startDate);
            const now = new Date();
            const diff = now - start;
            const ageDate = new Date(diff); 
            value = Math.abs(ageDate.getUTCFullYear() - 1970);
        }
        
        html += `
            <div class="col-12 col-xl-4">
                <div class="d-flex align-items-center">
                    <div class="d-inline-block">
                        <h1 class="font-family-mono fw-semi-bold stroke-text display-4"><span class="counter">${value}</span></h1>
                    </div>
                    <div class="d-inline-block ps-2">
                        <h4 class="line-height-100 fw-normal mb-0">${stat.suffix}</h4>
                        <p class="mono-heading">${stat.label}</p>
                    </div>
                </div>
            </div>
        `;
    });
    
    statsRow.html(html);
}

function renderServices(services) {
    const list = $('#services-list');
    let html = '';
    
    services.forEach(service => {
        html += `
            <li class="services-item">
                <div class="services-number">
                    <h1 class="font-family-mono fw-semi-bold stroke-text display-4">${service.id}</h1>
                </div>
                <div class="services-title icon-xl">
                    <i class="${service.icon}"></i>
                    <h6 class="mono-heading">${service.title}</h6>
                </div>
                <div>
                    <p>${service.description}</p>
                </div>
            </li>
        `;
    });
    
    list.html(html);
}

function renderResume(resume) {
    // Education
    const eduList = $('#education-list');
    let eduHtml = '';
    resume.education.forEach(edu => {
        eduHtml += `
            <div class="resume-box">
                <span class="resume-date">${edu.date}</span>
                <h5 class="fw-medium">${edu.title}</h5>
                <span>@ <a href="${edu.link}" target="_blank">${edu.place}</a></span>
            </div>
        `;
    });
    eduList.html(eduHtml);
    
    // Experience
    const expList = $('#experience-list');
    let expHtml = '';
    resume.experience.forEach(exp => {
        expHtml += `
            <div class="resume-box">
                <span class="resume-date">${exp.date}</span>
                <h5 class="fw-medium">${exp.title}</h5>
                <span>@ <a href="${exp.link}" target="_blank">${exp.place}</a></span>
            </div>
        `;
    });
    expList.html(expHtml);
}

function renderSkills(skills) {
    const list = $('#skills-list');
    let html = '';
    
    skills.forEach(skill => {
        html += `
            <div class="col-12 col-md-6">
                <div class="progress-custom">
                    <div class="progress-info">
                        <h6 class="mb-2">${skill.name}</h6>
                        <span class="percentage">${skill.percentage}%</span>
                    </div>
                    <div class="progress">
                        <div class="progress-bar-custom" role="progressbar" style="width: 0%" data-width="${skill.percentage}%" aria-valuenow="${skill.percentage}" aria-valuemin="0" aria-valuemax="100"></div>
                    </div>
                </div>
            </div>
        `;
    });
    
    list.html(html);
    
    // Animate progress bars after a short delay to ensure DOM is ready
    setTimeout(() => {
        $('.progress-bar-custom').each(function() {
            $(this).css('width', $(this).data('width'));
        });
    }, 500);
}

function renderProjects(projects) {
    const list = $('#projects-list');
    let html = '';
    
    projects.forEach((project, index) => {
        // Pad index with leading zero
        const num = (index + 1).toString().padStart(2, '0');
        
        html += `
            <li class="services-item">
                <div class="services-number">
                    <h1 class="font-family-mono fw-semi-bold stroke-text display-4">${num}</h1>
                </div>
                <div class="services-title icon-xl">
                    <!-- <i class="bi bi-code-slash"></i> -->
                    <h6 class="mono-heading">${project.title}</h6>
                </div>
                <div>
                    <p>${project.description}</p>
                    <p class="mt-2"><small><strong>Tech:</strong> ${project.technologies}</small></p>
                    ${project.link ? `<a href="${project.link}" target="_blank" class="button button-sm button-outline mt-2">View Project</a>` : ''}
                </div>
            </li>
        `;
    });
    
    list.html(html);
}

function renderContact(contact) {
    const list = $('#contact-list');
    let html = '';
    
    html += `
        <li>Email: ${contact.email}</li>
        <li>Address: ${contact.address}</li>
    `;
    
    list.html(html);
}
function renderWeekend(weekend) {
    const container = $('.weekend-content');
    let html = `
        <!-- Animated Road Background -->
        <div class="road-animation">
            <div class="road-line"></div>
            <div class="road-line"></div>
            <div class="road-line"></div>
        </div>

        <!-- Weekend Mode Warning Banner -->
        <div class="weekend-warning-banner">
            <div class="warning-content">
                <i class="bi bi-info-circle-fill me-2"></i>
                <span>You're viewing my <strong>Weekend Mode</strong>! Looking for professional details? Switch to <strong>Weekday Mode</strong> using the toggle button.</span>
            </div>
        </div>

        <!-- Weekend Hero -->
        <div class="weekend-hero text-center mb-5">
            <div class="bike-icon-wrapper mb-4">
                <i class="bi bi-bicycle bike-icon"></i>
            </div>
            <h6 class="title-heading mb-3">${weekend.intro.title}</h6>
            <h1 class="display-2 fw-semi-bold mb-4">${weekend.intro.heading}</h1>
            <p class="lead mb-4">${weekend.intro.description}</p>
            ${weekend.socials?.instagram ? `
                <a href="${weekend.socials.instagram}" target="_blank" class="social-link">
                    <i class="bi bi-instagram"></i> Follow my journey
                </a>
            ` : ''}
        </div>

        <!-- About Weekend Section -->
        ${weekend.about ? `
            <div class="weekend-about-section mb-5">
                <div class="row justify-content-center">
                    <div class="col-12 col-md-8">
                        <div class="weekend-about-card p-5">
                            <h6 class="title-heading mb-3">${weekend.about.title}</h6>
                            <h2 class="mb-4">${weekend.about.heading}</h2>
                            <p class="lead">${weekend.about.description}</p>
                        </div>
                    </div>
                </div>
            </div>
        ` : ''}

        <!-- Dreams & Favorites -->
        <div class="row g-4 justify-content-center mb-5">
            <div class="col-12 col-md-5">
                <div class="weekend-card dream-card p-4 h-100">
                    <h3 class="mb-4"><i class="bi bi-stars me-2"></i> Dream Destinations</h3>
                    <ul class="list-unstyled">
                        ${weekend.dreams.map(dream => `
                            <li class="mb-3">
                                <i class="bi bi-arrow-right-circle me-2"></i>${dream}
                            </li>
                        `).join('')}
                    </ul>
                </div>
            </div>
            <div class="col-12 col-md-5">
                <div class="weekend-card fav-card p-4 h-100">
                    <h3 class="mb-4"><i class="bi bi-heart-fill me-2"></i> What I Love</h3>
                    <div class="favorites-grid">
                        ${weekend.favorites.map(fav => `
                            <div class="favorite-item">
                                <i class="bi bi-check-circle-fill"></i>
                                <span>${fav}</span>
                            </div>
                        `).join('')}
                    </div>
                </div>
            </div>
        </div>

        <!-- Quote Section -->
        <div class="weekend-quote text-center">
            <blockquote class="blockquote">
                <p class="mb-0">"Life is a journey, not a destination"</p>
            </blockquote>
        </div>
    `;
    container.html(html);
}

// Re-initialize Bootstrap ScrollSpy after mode toggle
function reinitScrollSpy() {
    if (typeof bootstrap !== 'undefined') {
        const scrollSpyEl = document.querySelector('[data-bs-spy="scroll"]');
        if (scrollSpyEl) {
            const instance = bootstrap.ScrollSpy.getInstance(scrollSpyEl);
            if (instance) {
                instance.refresh();
            } else {
                new bootstrap.ScrollSpy(document.body, {
                    target: '.section-nav'
                });
            }
        }
    }
}
