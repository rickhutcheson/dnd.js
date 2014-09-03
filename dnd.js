/*
 * @module dnd
 * @copyright 2014 Rick Hutcheson [rick@oddlyaccurate.com]
 * @license GPLv3
 */

/*globals exports, require */


'use strict';
var dom = require('dom');


/**
 * @doc
 * Throughout this documentation, the HTML5 API for drag-and-drop is
 * referred to as "HTML-DND", and this wrapper api is called "dnd".
 */


/**
 * @doc
 * API 1 - Transfer API
 * ====================
 */

// TODO: API 1

/**
 * @doc
 *
 * API 2 - Source / Target API
 * ===========================
 *
 * This set of objects provides more control over the data transfer,
 * at the cost of simplicity. In many ways, it is a "renaming"
 * of HTML-DND, with some slight sugar. If you need to use
 * this API, then you might be better off just using HTML-DND.
 *
 *
 * Using this API
 * --------------
 *
 * The S/T api lets you construct `DragSource` and `DragTarget`
 * objects independently, without any formal connection between them.
 * This is useful for situations in which data is being transferred
 * from another location, such as a "file upload" widget.
 *
 *
 * Constructing a Drag Source
 * --------------------------
 * You can create an independent source of draggable data with the `createSource` function.
 */

/*
 * @constructs DataSource
 * @param {Element | Element[]} src - the element or elements to attach
 *        to this drag source
 * @param {SourceConfig} options - properties of this data source
 *
 * @typedef SourceConfig
 *
 * @optproperty {String | Object} data - A string with the data to transfer,
 *              or a pair `{type, value}`, where `type` is a string specifying
 *              the type of object to send, and `value` is a string containing
 *              that value. TODO: lookup API for sending files
 *
 * @optproperty {String | String[]} effects - One or more of the strings
 *              `"move"`, `"copy"`, and `"link"`.
 *
 * @optproperty {Element} view - The `Element` to use as the
 *              "drag image". If no view is specified, the browser's
 *              default view (a copy of the source element) is used.
 */
exports.createSource = function(src, options) {
  checkOptions(options);

  var that = {
    sources: (src instanceof Array ? src : [src]),
    effects: createEffectString(options.effects),
    data: options.data,
    view: options.view,

    // client-facing events
    onStart: null,
    onCancel: null,
    onDrop: null
};

  // client events
  makeDraggable(that);
  setupSourceEvents(that);

  return that;
};

function checkOptions (options) {
}

// HTML-DND requires that drag sources have a `draggable` attribute
// set to "true". This attribute changes the way that browsers handle
// the element; specifically, dragging the element no longer selects
// it; instead, the browser begins a drag animation for us.

function makeDraggable (ds) {
  dom.forEach(ds.sources, function(src) {
    src.setAttribute('draggable', 'true');
  });
}


// We attach some functionality to each of the HTML-DND events
// that are used for sources. Clients can hook into any of these
// events by setting the appropriate `onX` listeners
//
// Note: we attach to all events without checking whether ds
// has listeners defined because we want clients to be able to
// attach themselves later or conditionally.
function setupSourceEvents (ds) {
  dom.forEach(ds.sources, function(src) {

    src.addEventListener('dragstart', function(evt) {
      setSourceProperties(ds, evt.dataTransfer);
      ds.onStart && ds.onStart(evt.target);
    });

    src.addEventListener('dragend', function(evt) {
      ds.onCancel && ds.onCancel();
    });
  });
}


// transfer "properties" for sources:
// 1. data - transfer.setData(mime, data)
// 2. allowed effects - data.effectAllowed = <effect string>
// 3. dragged view - transfer.setDragImage()
function setSourceProperties(ds, transfer) {
  transfer.effectAllowed = ds.effects;
  if (ds.view) {
    transfer.setDragImage(ds.view, (ds.view.x || 0), (ds.view.y || 0));
  }
}


// HTML-DND uses a `dataTransfer.effectAllowed` property specified by
// a single string. This string uses camel-case to separate the effects
// allowed by a data source. Since this is pretty gross, we convert our
// input (an array of allowed options) to this camel-case string.
function createEffectString (effects) {
  if (!effects) {
    effects = [];
  } else if (typeof effects === 'string') {
    effects = [effects];
  } else {
    throw new Error('cannot create effect string'); // todo: change?
  }

  switch (effects.length) {
    case 0: return 'none';
    case 1: return effects[0];
    case 3: return 'all';
    default: {
      effects.sort();
      return effects.reduce(camelCase(effects));
    }
  }
}

function camelCase(first, second) {
  if (!first) {
    return second;
  } else {
    return first + second.charAt(0).toUpperCase() + second.slice(1);
  }
}


exports.createTarget = function(attached, options) {
  var that = {
    attached:  (attached instanceof Array ? attached : [attached]),
    effect: options.effect,
    accepts: options.accepts,
    // client listeners
    onEnter: undefined,
    onLeave: undefined,
    onDrop: undefined
  };

  return that;
};

function setupTargetEvents (dt) {
  dom.forEach(dt.targets, function(target) {

    target.addEventListener('dragenter', function(evt) {
      setTargetProperties(ds, evt.dataTransfer);
      if (!dt.onEnter) {
        evt.preventDefault()
      } else {
        if (dt.onEnter(evt.target)) {
          evt.preventDefault();
        }
      }
    });

    if (dt.onLeave) {
      target.addEventListener('dragleave', function(evt) {
        dt.onLeave(target);
      });
    }

    // HTML-DND requires us to cancel every `dragover` event
    // sent to our target
    target.addEventListener('dragover', function(evt) {
      evt.preventDefault();
    });
  });
}
