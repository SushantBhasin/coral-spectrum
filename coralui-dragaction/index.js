import 'coralui-externals';
import DragAction from './src/scripts/DragAction';

// Expose DragAction on the Coral namespace
window.Coral = window.Coral || {};
window.Coral.DragAction = DragAction;

// Apply DragAction on HTML elements with the attribute "coral-dragaction"
document.addEventListener('DOMContentLoaded', function() {
  const elements = document.body.querySelectorAll('[coral-dragaction]');
  for (let i = 0; i < elements.length; i++) {
    new DragAction(elements[i]);
  }
});

export {DragAction};