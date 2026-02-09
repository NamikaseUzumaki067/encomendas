// js/core/ui.js

export function qs(sel, root = document) {
  return root.querySelector(sel);
}

export function qsa(sel, root = document) {
  return Array.from(root.querySelectorAll(sel));
}

export function showToast(msg) {
  alert(msg); // depois a gente troca por toast bonito 😉
}

export function confirmBox(msg) {
  return window.confirm(msg);
}
