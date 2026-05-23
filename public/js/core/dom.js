(function () {
  function getEl(id) {
    return document.getElementById(id);
  }

  function qs(selector, root = document) {
    return root.querySelector(selector);
  }

  function qsa(selector, root = document) {
    return Array.from(root.querySelectorAll(selector));
  }

  function showElement(elementOrId, display = "block") {
    const el = typeof elementOrId === "string" ? document.getElementById(elementOrId) : elementOrId;
    if (el) el.style.display = display;
  }

  function hideElement(elementOrId) {
    const el = typeof elementOrId === "string" ? document.getElementById(elementOrId) : elementOrId;
    if (el) el.style.display = "none";
  }

  function setText(elementOrId, text) {
    const el = typeof elementOrId === "string" ? document.getElementById(elementOrId) : elementOrId;
    if (el) el.innerText = text;
  }

  window.getEl = window.getEl || getEl;
  window.qs = window.qs || qs;
  window.qsa = window.qsa || qsa;
  window.showElement = window.showElement || showElement;
  window.hideElement = window.hideElement || hideElement;
  window.setText = window.setText || setText;
})();
