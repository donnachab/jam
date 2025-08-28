/**
 * Initializes the festival logo carousel.
 */
export function initFestivalCarousel() {
  const carouselElement = document.querySelector(".festival-carousel");
  if (carouselElement) {
    const slides = carouselElement.querySelectorAll('.swiper-slide');
    // Check if there are enough slides to fill the view at the widest breakpoint (5)
    if (slides.length >= 5) {
      new Swiper(carouselElement, {
        loop: true,
        autoplay: { delay: 4000, disableOnInteraction: false },
        pagination: { el: ".swiper-pagination", clickable: true },
        slidesPerView: 2,
        spaceBetween: 20,
        breakpoints: {
          640: { slidesPerView: 3, spaceBetween: 30 },
          1024: { slidesPerView: 5, spaceBetween: 50 },
        },
      });
    } else {
      // Initialize without a loop to avoid the warning
      new Swiper(carouselElement, {
        loop: false,
        autoplay: { delay: 4000, disableOnInteraction: false },
        pagination: { el: ".swiper-pagination", clickable: true },
        slidesPerView: 2,
        spaceBetween: 20,
        breakpoints: {
          640: { slidesPerView: 3, spaceBetween: 30 },
          1024: { slidesPerView: 5, spaceBetween: 50 },
        },
      });
    }
    console.log("✅ Festival carousel initialized.");
  }
}

/**
 * Initializes or updates the community slideshow.
 * @param {Array} items - The array of community/charity items.
 * @returns {Swiper|null} The new Swiper instance.
 */
export function initCommunityCarousel(items) {
    if (document.querySelector(".community-swiper")) {
        const swiper = new Swiper(".community-swiper", {
          effect: "fade",
          fadeEffect: { crossFade: true },
          // Only enable loop mode if there's more than one item
          loop: items.length > 1,
          autoplay: { delay: 6000, disableOnInteraction: false },
          pagination: { el: ".swiper-pagination", clickable: true },
          navigation: {
            nextEl: ".swiper-button-next",
            prevEl: ".swiper-button-prev",
          },
        });
        console.log("✅ Community carousel initialized.");
        return swiper;
    }
    return null;
}
