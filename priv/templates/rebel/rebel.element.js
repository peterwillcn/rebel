console.log('rebel.element init')
function get_element_attributes(element) {
  var ret = {}
  for (var i = 0; i < element.attributes.length; i++) {
    var att = element.attributes[i]
    ret[att.name] = att.value
  }
  return ret
}

function to_array(dom_list) {
  var ret = []
  for (var i = 0; i < dom_list.length; i++) {
    ret.push(dom_list[i])
  }
  return ret
}

function to_map(element) {
  var ret = {}
  for (var key in element) {
    if (element[key]) {
      ret[key] = element[key]
    }
  }
  return ret
}

function default_properties(element) {
  return {
    rebel_id:     element.getAttribute("rebel-id"),
    id:           element.id,
    attributes:   get_element_attributes(element),
    className:    element.className,
    classList:    to_array(element.classList),
    // clientHeight: element.clientHeight, //int
    // clientLeft:   element.clientLeft,
    // clientTop:    element.clientTop,
    // clientWidth:  element.clientWidth,
    // contentEditable: element.contentEditable,
    dataset:      element.dataset,
    // dir:          element.dir,
    // lang:         element.lang,
    // offsetHeight: element.offsetHeight,
    // offsetLeft:   element.offsetLeft,
    // offsetParent: element.offsetParent,
    // offsetTop:    element.offsetTop,
    // offsetWidth:  element.offsetWidth,
    // id:           element.id,
    innerHTML:    element.innerHTML,
    innerText:    element.innerText,
    // localName:    element.localName,
    name:         element.name,
    // outerHTML:    element.outerHTML,
    // outerText:    element.outerText,
    // scrollHeight: element.scrollHeight,
    // scrollLeft:   element.scrollLeft,
    // scrollTop:    element.scrollTop,
    // scrollWidth:  element.scrollWidth,
    style:        to_map(element.style),
    tagName:      element.tagName,
    // tabIndex:     element.tabIndex,
    // title:        element.title,
    // defaultValue: element.defaultValue,
    // disabled:     element.disabled,
    // maxLength:    element.maxLength,
    // readOnly:     element.readOnly,
    // size:         element.size,
    // type:         element.type,
    value:        element.value
  }
}


Rebel.query = function(selector, what, where) {
  var searchie = where || document
  var ret = {}
  searchie.querySelectorAll(selector).forEach(function(element) {
    var id = element.id
    var id_selector
    if (id) {
      id_selector = "#" + id
    } else {
      var rebel_id = Drab.setid(element)
      id_selector = "[rebel-id='" + rebel_id + "']"
    }
    ret[id_selector] = {}
    if (what.length != 0) {
      for (var i in what) {
        var property = what[i]
        switch(property) {
          case "attributes":
            ret[id_selector][property] = get_element_attributes(element)
            break
          case "style":
            ret[id_selector][property] = to_map(element.style)
            break
          case "classList":
            ret[id_selector][property] = to_array(element.classList)
            break
          default:
            ret[id_selector][property] = element[property]
            break
        }
      }
    } else {
      ret[id_selector] = default_properties(element)
    }
  })
  return ret
}

function isObject(val) {
    if (val === null) { return false;}
    return ( (typeof val === 'function') || (typeof val === 'object') );
}

Rebel.set_prop = function(selector, what, where) {
  var searchie = where || document
  var i = 0
  searchie.querySelectorAll(selector).forEach(function(element) {
    for (var property in what) {
      var value = what[property]
      switch(property) {
        case "attributes":
          for (var p in value) { element.setAttribute(p, value[p]) }
          break
        case "style":
          for (var p in value) { element[property][p] = value[p] }
          break
        case "dataset":
          for (var p in value) { element[property][p] = value[p] }
          break
        default:
          element[property] = what[property]
          break
      }
    }
    i ++
  })
  return i
}

Rebel.insert_html = function(selector, position, html, where) {
  var searchie = where || document
  var i = 0
  searchie.querySelectorAll(selector).forEach(function(element) {
    element.insertAdjacentHTML(position, html)
    i++
  })
  return i
}
