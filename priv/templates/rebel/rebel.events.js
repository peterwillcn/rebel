const EVENTS = ["click", "change", "keyup", "keydown"]
const EVENTS_TO_DISABLE = <%= Rebel.Config.get(:events_to_disable_while_processing) |> Rebel.Core.encode_js %>

console.log('rebel events init')

Rebel.disable_rebel_objects = function(disable) {
  <%= if Rebel.Config.get(:disable_controls_when_disconnected) do %>
    document.querySelectorAll("[rebel-event]").forEach(function(element) {
      element['disabled'] = disable
    })
  <% end %>
}

//http://davidwalsh.name/javascript-debounce-function
function debounce(func, wait, immediate) {
    var timeout;
    return function() {
        var context = this, args = arguments;
        var later = function() {
            timeout = null;
            if (!immediate) func.apply(context, args);
        };
        var callNow = immediate && !timeout;
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
        if (callNow) func.apply(context, args);
    };
};

function payload(sender, event) {
  var p
  if (sender) {
    p = default_payload(sender, event)
  } else {
    p = {}
  }
  Rebel.additional_payloads.forEach(function(fx) {
    p = Object.assign(p, fx(sender, event))
  })
  return p
}

// default payload contains sender information and some info about event
function default_payload(sender, event) {
  var params = {}
  var form = closest(sender, function(el) {
    return el.nodeName == "FORM"
  })
  if (form) {
    var inputs = form.querySelectorAll("input, textarea, select")
    var i = 0
    inputs.forEach(function(input) {
      var key = input.name || input.id || false
      if (key) {
        if (input.type == "radio") {
          if (input.checked) {
            params[key] = input.value
          }
        } else {
          params[key] = input.value
        }
      }
    })
  }
  return {
    // by default, we pass back some sender properties
    id:       sender.id,
    name:     sender.name,
    class:    sender.className,
    classes:  sender.classList,
    text:     sender.innerText,
    html:     sender.innerHTML,
    value:    sender.value,
    dataset:  sender.dataset,
    rebel_id:  sender.getAttribute("rebel-id"),
    event: {
      altKey:   event.altKey,
      data:     event.data,
      key:      event.key,
      keyCode:  event.keyCode,
      metaKey:  event.metaKey,
      shiftKey: event.shiftKey,
      ctrlKey:  event.ctlrKey,
      type:     event.type,
      which:    event.which,
      clientX:  event.clientX,
      clientY:  event.clientY,
      offsetX:  event.offsetX,
      offsetY:  event.offsetY,
      pageX:    event.pageX,
      pageY:    event.pageY,
      screenX:  event.screenX,
      screenY:  event.screenY
    },
    form:      params
  }
}

function do_setid(whom) {
  if (!whom.getAttribute("rebel-id")) {
    whom.setAttribute("rebel-id", uuid())
  }
}

Rebel.setid = function(whom) {
  if (Array.isArray(whom)) {
    whom.forEach(function(x) {
      do_setid(x)
    })
  } else {
    do_setid(whom)
  }
  return whom.getAttribute("rebel-id")
}

function update_event_handler(node, event, func) {
  // TODO: learn more about event listeners
  // node.removeEventListener(event, func)
  // node.addEventListener(event, func)
  node["on" + event] = func
}

// set up the controls with rebel handlers
Rebel.set_event_handlers = function(obj) {
  var rebel_objects = []
  var rebel_objects_shortcut = []

  // first serve the shortcut controls by adding the longcut attrbutes
  EVENTS.forEach(function(ev) {
    if (obj) {
      var o = document.querySelector(obj)
      if (o) {
        rebel_objects_shortcut = o.parentNode.querySelectorAll("[rebel-" + ev + "]")
      }
    } else {
      rebel_objects_shortcut = document.querySelectorAll("[rebel-" + ev + "]")
    }
    // console.log(rebel_objects_shortcut)
    rebel_objects_shortcut.forEach(function(node) {
      node.setAttribute("rebel-event", ev)
      node.setAttribute("rebel-handler", node.getAttribute("rebel-" + ev))
    })
  })

  if (obj) {
    var o = document.querySelector(obj)
    if (o) {
      rebel_objects = o.parentNode.querySelectorAll("[rebel-event]")
    }
  } else {
    rebel_objects = document.querySelectorAll("[rebel-event]")
  }

  // Set the rebel-channel for the missing nodes
  rebel_objects.forEach(function(node) {
    if(!node.getAttribute("rebel-channel")) {
      var closest = node.closest('[rebel-channel]')
      if (closest) {
        node.setAttribute("rebel-channel", closest.getAttribute("rebel-channel"))
      } else {
        node.setAttribute("rebel-channel", Rebel.default_channel)
      }
    }
  })

  var events_to_disable = EVENTS_TO_DISABLE
  rebel_objects.forEach(function(node) {
    if(node.getAttribute("rebel-handler")) {

      var event_handler_function = function(event) {
        // disable current control - will be re-enabled after finish
        <%= if Rebel.Config.get(:disable_controls_while_processing) do %>
          if(events_to_disable.indexOf(event_name) >= 0) {
            node['disabled'] = true
          }
        <% end %>
        Rebel.setid(node)
        // send the message back to the server
        Rebel.run_handler(
          node.getAttribute("rebel-channel"),
          event_name,
          node.getAttribute("rebel-handler"),
          payload(node, event)
          <%= if Rebel.Config.get(:disable_controls_while_processing) do %>
            , function() {
                node['disabled'] = false
              }
          <% end %>
          )
      }

      var event_name = node.getAttribute("rebel-event")

      // options. Wraps around event_handler_function, eg. debounce(event_handler_function, 500)
      var options = node.getAttribute("rebel-options")
      matched = /(\w+)\s*\((.*)\)/.exec(options)
      if(matched) {
        var fname = matched[1]
        var fargs = matched[2].replace(/^\s+|\s+$/g, '') // strip whitespace
        var f = fname + "(event_handler_function" + (fargs == "" ? "" : ", " + fargs) + ")"
        update_event_handler(node, event_name, eval(f))
      } else {
        update_event_handler(node, event_name, event_handler_function)
      }

    } else {
      console.log("Rebel Error: rebel-event definded without rebel-handler", this)
    }
  })
}
Rebel.on_load(function(rebel) {
  // TODO: Fix this. rebel is an empty object
  // rebel.disable_rebel_objects(true)
})

Rebel.on_disconnect(function(rebel) {
  rebel.disable_rebel_objects(true)
})

Rebel.on_connect(function(resp, channel_name, rebel) {
  rebel.set_event_handlers()

  // re-enable rebel controls
  rebel.disable_rebel_objects(false)
})
