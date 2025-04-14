// Loader de page
window.addEventListener('load', () => {
  const pageLoader = document.getElementById('page-loader');
  if (pageLoader) {
    pageLoader.classList.add('hidden');
  }
});

  // Animation d'apparition au scroll
  const sections = document.querySelectorAll("section");
  
  const observer = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add("visible");
      }
    });
  }, {
    threshold: 0.3
  });
  
  sections.forEach(section => {
    observer.observe(section);
  });
  
  // Optionnel : Zoom des images au survol
  const images = document.querySelectorAll(".project img");
  
  images.forEach(image => {
    image.style.transition = "transform 0.5s ease";
    image.addEventListener("mouseover", () => {
      image.style.transform = "scale(1.1)";
    });
    image.addEventListener("mouseout", () => {
      image.style.transform = "scale(1)";
    });
  });

    