// ------------------------------------------------------------------------------
// Phoenix config.
// https://github.com/kasper/phoenix/blob/d0a3ac/API.md
//
// Inspired by MercuryMover.
// http://www.heliumfoot.com/mercurymover/
// Move and resize windows from the keyboard, positioning them precisely where you want.
//
// Inspired by @kgrossjo config.
// https://github.com/kgrossjo/phoenix-config/

Phoenix.set({
  openAtLogin: true,
})

// ------------------------------------------------------------------------------
// Const and globals.

var INCREMENT_LOW = 1
var INCREMENT_MID = 10
var INCREMENT_HIGH = 100
var INCREMENT_MAX = 100000000

var shortcuts = []

// ------------------------------------------------------------------------------
// Shortcut constructor.

var Shortcut = function (key, modifiers, modalText) {
  this.modal = Modal.build({
    text: modalText,
    weight: 16,
  })
  this.modal.origin = {
    x: (Screen.main().flippedFrame().width - this.modal.frame().width) / 2,
    y: (Screen.main().flippedFrame().height - this.modal.frame().height) / 2,
  }
  this.oneTimeSubShortcuts = []
  this.repeatableSubShortcuts = []
  this.subShortcuts = []
  shortcuts.push(this)
  var self = this
  this.key = new Key(key, modifiers, function () {
    self.enableSubShortcuts()
    self.modal.show()
  })
}

Shortcut.prototype.enableSubShortcuts = function () {

  this.disableSubShortcuts()
  var self = this

  // Close any previously opened modal except the current one.
  shortcuts.forEach(function (shortcut) {
    if (shortcut !== self) {
      shortcut.modal.close()
    }
  })

  // One time sub-shortcuts: the modal will be dismissed immediately after a one time shortcut is hit.
  this.oneTimeSubShortcuts.forEach(function (x) {
    var shortcut = new Key(x.key, x.modifiers, function () {
      x.cb()
      self.modal.close()
      self.disableSubShortcuts()
    })
    shortcut.enable()
    self.subShortcuts.push(shortcut)
  })

  // Repeatable sub-shortcuts: the modal will not be dismissed until a one time shortcut is hit.
  this.repeatableSubShortcuts.forEach(function (x) {
    var shortcut = new Key(x.key, x.modifiers, function () {
      x.cb()
    })
    shortcut.enable()
    self.subShortcuts.push(shortcut)
  })

}

Shortcut.prototype.disableSubShortcuts = function () {
  this.subShortcuts.forEach(function (shortcut) {
    shortcut.disable()
  })
  this.subShortcuts = []
}

Shortcut.prototype.addOneTimeSubShortcut = function (key, modifiers, cb) {
  this.oneTimeSubShortcuts.push({key: key, modifiers: modifiers, cb: cb})
}

Shortcut.prototype.addRepeatableSubShortcut = function (key, modifiers, cb) {
  this.repeatableSubShortcuts.push({key: key, modifiers: modifiers, cb: cb})
}

// ------------------------------------------------------------------------------
// Main shortcuts to activate move or resize mode.

var arrow = [
  '\n',
  '↑\n',
  '←    →\n',
  '↓\n',
  '\n',
].join('')

// Move mode.
var moveMode = new Shortcut(
  'up',
  ['shift', 'ctrl', 'alt'],
  [
    'MOVE\n',
    arrow,
    'Hit esc to dismiss\n',
    'Use no modifier key to move ' + INCREMENT_LOW + ' pixel.\n',
    'Use the shift key to move ' + INCREMENT_MID + ' pixels.\n',
    'Use the option key to move ' + INCREMENT_HIGH + ' pixels.\n',
    'Use the cmd key to move to the edge of the screen.\n',
  ].join('')
)

// Resize right/down mode.
var resizeMode = new Shortcut(
  'right',
  ['shift', 'ctrl', 'alt'],
  [
    'RESIZE\n',
    arrow,
    'Hit esc to dismiss\n',
    'Use no modifier key to resize ' + INCREMENT_LOW + ' pixel.\n',
    'Use the shift key to resize ' + INCREMENT_MID + ' pixels.\n',
    'Use the option key to resize ' + INCREMENT_HIGH + ' pixels.\n',
    'Use the cmd key to resize to the edge of the screen.\n',
  ].join('')
)

// ------------------------------------------------------------------------------
// Resize.

var resize = function (increment, direction) {
  var window = Window.focused()
  if (window) {
    var size
    switch (direction) {
      case 'right':
        size = { width: window.size().width + increment, height: window.size().height }
        break
      case 'left':
        size = { width: window.size().width - increment, height: window.size().height }
        break
      case 'up':
        size = { width: window.size().width, height: window.size().height - increment }
        break
      case 'down':
        size = { width: window.size().width, height: window.size().height + increment }
        break
    }
    window.setSize(size)
  }
}

resizeMode.addRepeatableSubShortcut('right', [], function () { resize(INCREMENT_LOW, 'right') })
resizeMode.addRepeatableSubShortcut('left', [], function () { resize(INCREMENT_LOW, 'left') })
resizeMode.addRepeatableSubShortcut('up', [], function () { resize(INCREMENT_LOW, 'up') })
resizeMode.addRepeatableSubShortcut('down', [], function () { resize(INCREMENT_LOW, 'down') })

resizeMode.addRepeatableSubShortcut('right', ['shift'], function () { resize(INCREMENT_MID, 'right') })
resizeMode.addRepeatableSubShortcut('left', ['shift'], function () { resize(INCREMENT_MID, 'left') })
resizeMode.addRepeatableSubShortcut('up', ['shift'], function () { resize(INCREMENT_MID, 'up') })
resizeMode.addRepeatableSubShortcut('down', ['shift'], function () { resize(INCREMENT_MID, 'down') })

resizeMode.addRepeatableSubShortcut('right', ['alt'], function () { resize(INCREMENT_HIGH, 'right') })
resizeMode.addRepeatableSubShortcut('left', ['alt'], function () { resize(INCREMENT_HIGH, 'left') })
resizeMode.addRepeatableSubShortcut('up', ['alt'], function () { resize(INCREMENT_HIGH, 'up') })
resizeMode.addRepeatableSubShortcut('down', ['alt'], function () { resize(INCREMENT_HIGH, 'down') })

resizeMode.addRepeatableSubShortcut('right', ['cmd'], function () { resize(INCREMENT_MAX, 'right') })
resizeMode.addRepeatableSubShortcut('left', ['cmd'], function () { resize(INCREMENT_MAX, 'left') })
resizeMode.addRepeatableSubShortcut('up', ['cmd'], function () { resize(INCREMENT_MAX, 'up') })
resizeMode.addRepeatableSubShortcut('down', ['cmd'], function () { resize(INCREMENT_MAX, 'down') })

// ------------------------------------------------------------------------------
// Move.

var move = function (increment, direction) {
  var window = Window.focused()
  if (window) {
    var coords
    switch (direction) {
      case 'right':
        coords = { x: window.topLeft().x + increment, y: window.topLeft().y }
        break
      case 'left':
        coords = { x: window.topLeft().x - increment, y: window.topLeft().y }
        break
      case 'up':
        coords = { x: window.topLeft().x, y: window.topLeft().y - increment }
        break
      case 'down':
        coords = { x: window.topLeft().x, y: window.topLeft().y + increment }
        break
    }
    window.setTopLeft(coords)
  }
}

var moveToEdge = function (direction) {
  var window = Window.focused()
  if (window) {
    var coords
    switch (direction) {
      case 'right':
        coords = { x: Screen.main().flippedFrame().width - window.size().width, y: window.topLeft().y }
        break
      case 'left':
        coords = { x: 0, y: window.topLeft().y }
        break
      case 'up':
        coords = { x: window.topLeft().x, y: 0 }
        break
      case 'down':
        coords = { x: window.topLeft().x, y: Screen.main().flippedFrame().height - window.size().height }
        break
    }
    window.setTopLeft(coords)
  }
}

moveMode.addRepeatableSubShortcut('right', [], function () { move(INCREMENT_LOW, 'right') })
moveMode.addRepeatableSubShortcut('left', [], function () { move(INCREMENT_LOW, 'left') })
moveMode.addRepeatableSubShortcut('up', [], function () { move(INCREMENT_LOW, 'up') })
moveMode.addRepeatableSubShortcut('down', [], function () { move(INCREMENT_LOW, 'down') })

moveMode.addRepeatableSubShortcut('right', ['shift'], function () { move(INCREMENT_MID, 'right') })
moveMode.addRepeatableSubShortcut('left', ['shift'], function () { move(INCREMENT_MID, 'left') })
moveMode.addRepeatableSubShortcut('up', ['shift'], function () { move(INCREMENT_MID, 'up') })
moveMode.addRepeatableSubShortcut('down', ['shift'], function () { move(INCREMENT_MID, 'down') })

moveMode.addRepeatableSubShortcut('right', ['alt'], function () { move(INCREMENT_HIGH, 'right') })
moveMode.addRepeatableSubShortcut('left', ['alt'], function () { move(INCREMENT_HIGH, 'left') })
moveMode.addRepeatableSubShortcut('up', ['alt'], function () { move(INCREMENT_HIGH, 'up') })
moveMode.addRepeatableSubShortcut('down', ['alt'], function () { move(INCREMENT_HIGH, 'down') })

moveMode.addRepeatableSubShortcut('right', ['cmd'], function () { moveToEdge('right') })
moveMode.addRepeatableSubShortcut('left', ['cmd'], function () { moveToEdge('left') })
moveMode.addRepeatableSubShortcut('up', ['cmd'], function () { moveToEdge('up') })
moveMode.addRepeatableSubShortcut('down', ['cmd'], function () { moveToEdge('down') })

// ------------------------------------------------------------------------------
// Custom size/position shortcuts.

var maximise = function () {
  var window = Window.focused()
  if (window) {
    window.maximise()
  }
}

var center = function () {
  var window = Window.focused()
  if (window) {
    var screenFrame = Screen.main().flippedFrame()
    var x = (screenFrame.width - window.size().width) / 2
    var y = (screenFrame.height - window.size().height) / 2
    window.setTopLeft({ x: x, y: y })
  }
}

var customShortcut1 = function () {
  var window = Window.focused()
  if (window) {
    window.setFrame({ x: 5, y: 27, width: 1204, height: 756 })  // Safari size/position.
  }
}

var customShortcut2 = function () {
  var window = Window.focused()
  if (window) {
    window.setFrame({ x: 5, y: 27, width: 1615, height: 1069 })  // Safari (external monitor) size/position.
  }
}

var customShortcut3 = function () {
  var window = Window.focused()
  if (window) {
    window.setTopLeft({ x: 5, y: 27 })  // Terminal position.
  }
}

var dismiss = function () {
  return true
}

resizeMode.addOneTimeSubShortcut('m', [], maximise)
resizeMode.addOneTimeSubShortcut('=', [], center)
resizeMode.addOneTimeSubShortcut('s', [], customShortcut1)
resizeMode.addOneTimeSubShortcut('f', [], customShortcut2)
resizeMode.addOneTimeSubShortcut('t', [], customShortcut3)
resizeMode.addOneTimeSubShortcut('escape', [], dismiss)

moveMode.addOneTimeSubShortcut('m', [], maximise)
moveMode.addOneTimeSubShortcut('=', [], center)
moveMode.addOneTimeSubShortcut('s', [], customShortcut1)
moveMode.addOneTimeSubShortcut('f', [], customShortcut2)
moveMode.addOneTimeSubShortcut('t', [], customShortcut3)
moveMode.addOneTimeSubShortcut('escape', [], dismiss)