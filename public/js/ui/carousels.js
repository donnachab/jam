/**
 * Initializes the festival logo carousel.
 */
export function initFestivalCarousel() {
  const carouselElement = document.querySelector(".festival-carousel");
  if (carouselElement) {
    const slides = carouselElement.querySelectorAll('.swiper-slide');
    new Swiper(carouselElement, {
      // Only enable loop if there are enough slides for the largest breakpoint (5)
      loop: slides.length >= 5, 
      autoplay: { delay: 4000, disableOnInteraction: false },
      pagination: { el: ".swiper-pagination", clickable: true },
      slidesPerView: 2,
      spaceBetween: 20,
      breakpoints: {
        640: { slidesPerView: 3, spaceBetween: 30 },
        1024: { slidesPerView: 5, spaceBetween: 50 },
      },
    });
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
