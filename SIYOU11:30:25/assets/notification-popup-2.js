class NotificationPopup2 extends HTMLElement {
  connectedCallback() {
    // Find the parent section element (which has the .not-pu-section class)
    this.popup = this.closest('.not-pu-section');
    if (!this.popup) return;

    this.closeBtn = this.popup.querySelector(".newsletter__close-btn");
    this.hasSubscription = this.dataset.hasSubscription === "true";
    this.delay = Number(this.dataset.delay) || 0;
    this.cookie = document.cookie.includes("hideNotificationPopup2=true");

    if (this.hasSubscription || this.cookie) return;

    // Bind methods for proper cleanup
    this.handleClose = this.handleClose.bind(this);
    this.handleKeydown = this.handleKeydown.bind(this);

    setTimeout(() => {
      this.popup.classList.remove("hidden");
      this.popup.classList.add("wt-popup-fade-in");
      // Focus the close button for accessibility
      if (this.closeBtn) this.closeBtn.focus();
    }, this.delay * 1000);

    // Close button click handler
    if (this.closeBtn) {
      this.closeBtn.addEventListener("click", this.handleClose);
    }

    // Escape key handler
    document.addEventListener("keydown", this.handleKeydown);
  }

  disconnectedCallback() {
    // Clean up event listeners
    if (this.closeBtn) {
      this.closeBtn.removeEventListener("click", this.handleClose);
    }
    document.removeEventListener("keydown", this.handleKeydown);
  }

  handleClose(e) {
    if (e) e.preventDefault();
    this.popup.classList.add("hidden");
    this.popup.classList.remove("wt-popup-fade-in");
    this.setCookie("hideNotificationPopup2", "true", 7);
  }

  handleKeydown(e) {
    if (e.key === "Escape" && !this.popup.classList.contains("hidden")) {
      this.handleClose();
    }
  }

  setCookie(name, value, days) {
    const date = new Date();
    date.setTime(date.getTime() + days * 24 * 60 * 60 * 1000);
    const expires = `expires=${date.toUTCString()}`;
    document.cookie = `${name}=${value};${expires};path=/`;
  }
}

customElements.define("notification-popup-2", NotificationPopup2);
