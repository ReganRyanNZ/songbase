// This is a manifest file that'll be compiled into application.js, which will include all the files
// listed below.
//
// Any JavaScript/Coffee file within this directory, lib/assets/javascripts, vendor/assets/javascripts,
// or any plugin's vendor/assets/javascripts directory can be referenced here using a relative path.
//
// It's not advisable to add code directly here, but if you do, it'll appear at the bottom of the
// compiled file. JavaScript code in this file should be added after the last require_* statement.
//
// Read Sprockets README (https://github.com/rails/sprockets#sprockets-directives) for details
// about supported directives.
//
//= require react
//= require react_ujs
//= require_tree ./vendor
//= require components
//= require serviceworker-companion

// Workaround for delete buttons that don't need jquery
class Confirm {
  constructor(el) {
    this.message = el.getAttribute('data-confirm')
    if (this.message) {
      el.form.addEventListener('submit', this.confirm.bind(this))
    } else {
      console && console.warn('No value specified in `data-confirm`', el)
    }
  }

  confirm(e) {
    if (!window.confirm(this.message)) {
      e.preventDefault();
    }
  }
}

Array.from(document.querySelectorAll('[data-confirm]')).forEach((el) => {
  new Confirm(el)
})

document.addEventListener('DOMContentLoaded', function() {
  // Delete book confirmation modal
  (function() {
    var deleteBtn = document.getElementById('delete-book-btn');
    var modal = document.getElementById('delete-confirm-modal');
    var cancelBtn = document.getElementById('delete-cancel-btn');
    var confirmBtn = document.getElementById('delete-confirm-btn');
    var deleteForm = document.getElementById('delete-book-form');

    if (deleteBtn && modal) {
      deleteBtn.addEventListener('click', function() {
        modal.style.display = 'flex';
      });

      cancelBtn.addEventListener('click', function() {
        modal.style.display = 'none';
      });

      confirmBtn.addEventListener('click', function() {
        modal.style.display = 'none';
        if (deleteForm) deleteForm.submit();
      });

      modal.addEventListener('click', function(e) {
        if (e.target === modal) {
          modal.style.display = 'none';
        }
      });
    }
  })();

  // Auto-hide flash notices
  (function() {
    var flash = document.querySelector('#notice, #alert');
    if (flash) {
      setTimeout(function() {
        flash.style.transition = 'opacity 0.3s';
        flash.style.opacity = '0';
        setTimeout(function() { flash.remove(); }, 300);
      }, 3000);
    }
  })();
});
