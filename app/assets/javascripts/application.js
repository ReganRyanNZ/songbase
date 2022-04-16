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
