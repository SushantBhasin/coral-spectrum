/*
 * ADOBE CONFIDENTIAL
 *
 * Copyright 2017 Adobe Systems Incorporated
 * All Rights Reserved.
 *
 * NOTICE:  All information contained herein is, and remains
 * the property of Adobe Systems Incorporated and its suppliers,
 * if any.  The intellectual and technical concepts contained
 * herein are proprietary to Adobe Systems Incorporated and its
 * suppliers and may be covered by U.S. and Foreign Patents,
 * patents in process, and are protected by trade secret or copyright law.
 * Dissemination of this information or reproduction of this material
 * is strictly forbidden unless prior written permission is obtained
 * from Adobe Systems Incorporated.
 */

import {ComponentMixin} from '/coralui-mixin-component';
import {Collection} from '/coralui-collection';
import '/coralui-component-icon';
import treeItem from '../templates/treeItem';
import {transform, commons, validate} from '/coralui-util';

const CLASSNAME = 'coral3-TreeView-item';

/**
 Enumeration for {@link TreeItem} variants.
 
 @typedef {Object} TreeItemVariantEnum
 
 @property {String} DRILLDOWN
 Default variant with icon to expand/collapse subtree.
 @property {String} LEAF
 Variant for leaf items. Icon to expand/collapse subtree is hidden.
 */
const variant = {
  /* Default variant with icon to expand/collapse subtree. */
  DRILLDOWN: 'drilldown',
  /* Variant for leaf items. Icon to expand/collapse subtree is hidden. */
  LEAF: 'leaf'
};

const ALL_VARIANT_CLASSES = [];

for (const variantValue in variant) {
  ALL_VARIANT_CLASSES.push(`${CLASSNAME}--${variant[variantValue]}`);
}

/**
 @class Coral.Tree.Item
 @classdesc A Tree item component
 @htmltag coral-tree-item
 @extends {HTMLElement}
 @extends {ComponentMixin}
 */
class TreeItem extends ComponentMixin(HTMLElement) {
  /** @ignore */
  constructor() {
    super();
    
    // Prepare templates
    this._elements = {
      // Create or fetch the content zones
      content: this.querySelector('coral-tree-item-content') || document.createElement('coral-tree-item-content')
    };
    treeItem.call(this._elements);
  
    // Tells the collection to automatically detect the items and handle the events
    this.items._startHandlingItems();
  }
  
  /**
   The parent tree. Returns <code>null</code> if item is the root.
   
   @type {HTMLElement}
   @readonly
   */
  get parent() {
    return this._parent || null;
  }
  
  /**
   The content of this tree item.
   
   @type {HTMLElement}
   @contentzone
   */
  get content() {
    return this._getContentZone(this._elements.content);
  }
  set content(value) {
    this._setContentZone('content', value, {
      handle: 'content',
      tagName: 'coral-tree-item-content',
      insert: function(content) {
        this._elements.header.appendChild(content);
      }
    });
  }
  
  /**
   The Collection Interface that allows interacting with the items that the component contains.
   
   @type {Collection}
   @readonly
   */
  get items() {
    // Construct the collection on first request
    if (!this._items) {
      this._items = new Collection({
        host: this,
        itemTagName: 'coral-tree-item',
        itemSelector: ':scope > coral-tree-item',
        container: this._elements.subTreeContainer,
        filter: this._filterItem.bind(this),
        onItemAdded: this._onItemAdded,
        onItemRemoved: this._onItemRemoved
      });
    }
  
    return this._items;
  }
  
  /**
   Whether the item is expanded. Expanded cannot be set to <code>true</code> if the item is disabled.
   
   @type {Boolean}
   @default false
   @htmlattribute expanded
   @htmlattributereflected
   */
  get expanded() {
    return this._expanded || false;
  }
  set expanded(value) {
    value = transform.booleanAttr(value);
    const triggerEvent = this.expanded !== value;
    
    this._expanded = value;
    this._reflectAttribute('expanded', this._expanded);
  
    const header = this._elements.header;
    const subTreeContainer = this._elements.subTreeContainer;
  
    this.classList.toggle('is-open', this._expanded);
    this.classList.toggle('is-collapsed', !this._expanded);
    
    header.setAttribute('aria-expanded', this._expanded);
    subTreeContainer.setAttribute('aria-hidden', !this._expanded);
    
    this.trigger('coral-tree-item:_expandedchanged');
  
    const self = this;
    // Do animation in next frame to avoid a forced reflow
    window.requestAnimationFrame(() => {
      // Don't animate on initialization
      if (self._animate) {
        // Remove height as we want the drawer to naturally grow if content is added later
        commons.transitionEnd(subTreeContainer, () => {
          if (self.expanded) {
            subTreeContainer.style.height = '';
          }
          else {
            subTreeContainer.hidden = true;
          }
  
          // Trigger once the animation is over to inform coral-tree
          if (triggerEvent) {
            self.trigger('coral-tree-item:_afterexpandedchanged');
          }
        });
    
        // Force height to enable transition
        if (!self.expanded) {
          subTreeContainer.style.height = `${subTreeContainer.scrollHeight}px`;
        }
        else {
          subTreeContainer.hidden = false;
        }
  
        // We read the offset height to force a reflow, this is needed to start the transition between absolute values
        // https://blog.alexmaccaw.com/css-transitions under Redrawing
        // eslint-disable-next-line no-unused-vars
        const offsetHeight = subTreeContainer.offsetHeight;
        
        subTreeContainer.style.height = self.expanded ? `${subTreeContainer.scrollHeight}px` : 0;
      }
      else {
        // Make sure it's animated next time
        self._animate = true;
    
        // Hide it on initialization if closed
        if (!self.expanded) {
          subTreeContainer.style.height = 0;
          subTreeContainer.hidden = true;
        }
      }
    });
  }
  
  /**
   The item's variant. See {@link TreeItemVariantEnum}.
   
   @type {String}
   @default TreeItemVariant.DRILLDOWN
   @htmlattribute variant
   @htmlattributereflected
   */
  get variant() {
    return this._variant || variant.DRILLDOWN;
  }
  set variant(value) {
    value = transform.string(value).toLowerCase();
    this._variant = validate.enumeration(variant, value) && value || variant.DRILLDOWN;
  
    // removes every existing variant
    this.classList.remove(...ALL_VARIANT_CLASSES);
    this.classList.add(`${CLASSNAME}--${this._variant}`);
  }
  
  /**
   Whether the item is selected.
   
   @type {Boolean}
   @default false
   @htmlattribute selected
   @htmlattributereflected
   */
  get selected() {
    return this._selected || false;
  }
  set selected(value) {
    this._selected = transform.booleanAttr(value);
    this._reflectAttribute('selected', this._selected);
  
    this._elements.header.classList.toggle('is-selected', this._selected);
    this._elements.header.setAttribute('aria-selected', this._selected);
    
    this.trigger('coral-tree-item:_selectedchanged');
  }
  
  /**
   Whether this item is disabled.
   
   @type {Boolean}
   @default false
   @htmlattribute disabled
   @htmlattributereflected
   */
  get disabled() {
    return this._disabled || false;
  }
  set disabled(value) {
    this._disabled = transform.booleanAttr(value);
    this._reflectAttribute('disabled', this._disabled);
  
    this._elements.header.classList.toggle('is-disabled', this._disabled);
    this._elements.header.setAttribute('aria-disabled', this._disabled);
    
    this.trigger('coral-tree-item:_disabledchanged');
  }
  
  /**
   @ignore
   */
  get hidden() {
    return this.hasAttribute('hidden');
  }
  set hidden(value) {
    this._reflectAttribute('hidden', transform.booleanAttr(value));
  
    // We redefine hidden to trigger an event
    this.trigger('coral-tree-item:_hiddenchanged');
  }
  
  /** @private */
  _filterItem(item) {
    // Handle nesting check for parent tree item
    // Use parentNode for added items
    // Use _parent for removed items
    return item.parentNode && item.parentNode.parentNode === this || item._parent === this;
  }
  
  /** @private */
  _onItemAdded(item) {
    item._parent = this;
  }
  
  /** @private */
  _onItemRemoved(item) {
    item._parent = undefined;
  }
  
  /**
   Handles the focus of the item.
 
   @ignore
   */
  focus() {
    this._elements.header.focus();
  }
  
  /**
   Returns {@link TreeItem} variants.
   
   @return {TreeItemVariantEnum}
   */
  static get variant() { return variant; }
  
  get _contentZones() { return {'coral-tree-item-content': 'content'}; }
  
  /** @ignore */
  static get observedAttributes() {
    return ['selected', 'disabled', 'variant', 'expanded', 'hidden'];
  }
  
  /** @ignore */
  connectedCallback() {
    super.connectedCallback();
    
    this.classList.add(CLASSNAME);
  
    // a11y
    this.setAttribute('role', 'treeitem');
    this.setAttribute('aria-selected', this.selected);
    this._elements.header.setAttribute('aria-controls', this._elements.subTreeContainer.id);
    this._elements.subTreeContainer.setAttribute('aria-labelledby', this._elements.header.id);
  
    // Default reflected attributes
    if (!this._variant) { this.variant = variant.DRILLDOWN; }
    this.expanded = this.expanded;
    
    // Render the template and set element references
    const frag = document.createDocumentFragment();
  
    const templateHandleNames = ['header', 'icon', 'subTreeContainer'];
    
    const subTree = this.querySelector('.coral3-TreeView');
    if (subTree) {
      const items = subTree.querySelectorAll('coral-tree-item');
      for (let i = 0; i < items.length; i++) {
        this._elements.subTreeContainer.appendChild(items[i]);
      }
    }
    
    // Add templates into the frag
    frag.appendChild(this._elements.header);
    frag.appendChild(this._elements.subTreeContainer);
  
    const content = this._elements.content;
    const subTreeContainer = this._elements.subTreeContainer;
  
    // Assign the content zones, moving them into place in the process
    this.content = content;
  
    // Move any remaining elements into the content sub-component
    while (this.firstChild) {
      const child = this.firstChild;
      if (child.nodeName === 'CORAL-TREE-ITEM') {
        // Adding parent attribute to access the parent directly
        child._parent = this;
        // Add tree items to the sub tree container
        subTreeContainer.appendChild(child);
      }
      else if (child.nodeType === Node.TEXT_NODE ||
        child.nodeType === Node.ELEMENT_NODE && templateHandleNames.indexOf(child.getAttribute('handle')) === -1) {
        // Add non-template elements to the content
        content.appendChild(child);
      }
      else {
        // Remove anything else element
        this.removeChild(child);
      }
    }
  
    // Lastly, add the fragment into the container
    this.appendChild(frag);
  }
  
  /**
   Triggered when {@link TreeItem#selected} changed.
 
   @typedef {CustomEvent} coral-tree-item:_selectedchanged
   
   @private
   */
  
  /**
   Triggered when {@link TreeItem#expanded} changed.
 
   @typedef {CustomEvent} coral-tree-item:_expandedchanged
   
   @private
   */
  
  /**
   Triggered when {@link TreeItem#hidden} changed.
 
   @typedef {CustomEvent} coral-tree-item:_hiddenchanged
   
   @private
   */
  
  /**
   Triggered when {@link TreeItem#disabled} changed.
 
   @typedef {CustomEvent} coral-tree-item:_disabledchanged
   
   @private
   */
}

export default TreeItem;
