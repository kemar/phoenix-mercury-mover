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

const INCREMENT_LOW = 1
const INCREMENT_MID = 10
const INCREMENT_HIGH = 100

const EXTRA_SPACE = 2

const DIRECTIONS = ['right', 'left', 'up', 'down']

// The axis and sign each direction moves/grows along.
const AXES = { right: 'x', left: 'x', up: 'y', down: 'y' }
const SIGNS = { right: 1, left: -1, up: -1, down: 1 }
const DIMENSIONS = { x: 'width', y: 'height' }

const mainShortcuts = []

// Calls `fn` with the focused window, skipping the call entirely when there is none.
const withFocusedWindow = (fn) => (...args) => {
  const window = Window.focused()
  if (window) fn(window, ...args)
}

// ------------------------------------------------------------------------------
// Shortcut class.

class Shortcut {
  constructor(key, modifiers, modalText) {
    this.modal = Modal.build({ text: modalText, weight: 16, textAlignment: 'center', appearance: 'light' })
    this.subShortcuts = []
    this.keys = []
    mainShortcuts.push(this)
    this.key = new Key(key, modifiers, () => {
      this.disableSubShortcuts()
      this.enableSubShortcuts()
      this.showModal()
    })
  }

  showModal() {
    // Close any previously opened modal.
    // This is necessary because we have several main shortcuts and hitting
    // them in a consecutive manner would result in multiple opened modals.
    mainShortcuts.forEach((shortcut) => {
      if (shortcut !== this) {
        shortcut.modal.close()
      }
    })

    // Center the current modal on the current screen.
    const screenFrame = Screen.main().frame()
    const modalFrame = this.modal.frame()
    this.modal.origin = {
      x: screenFrame.x + (screenFrame.width - modalFrame.width) / 2,
      y: screenFrame.y + (screenFrame.height - modalFrame.height) / 2,
    }

    this.modal.show()
  }

  enableSubShortcuts() {
    const closeKey = new Key('escape', [], () => {
      this.modal.close()
      this.disableSubShortcuts()
    })
    closeKey.enable()
    this.keys.push(closeKey)

    this.subShortcuts.forEach(({ key, modifiers, cb }) => {
      const subKey = new Key(key, modifiers, cb)
      subKey.enable()
      this.keys.push(subKey)
    })
  }

  disableSubShortcuts() {
    this.keys.forEach((key) => key.disable())
    this.keys = []
  }

  addSubShortcut(key, modifiers, cb) {
    this.subShortcuts.push({ key, modifiers, cb })
  }
}

// ------------------------------------------------------------------------------
// Main shortcuts to activate `move` or `resize` mode.

const arrows = '\n↑\n←    →\n↓\n\n'

// Move mode.
const moveMode = new Shortcut('up', ['shift', 'ctrl', 'alt'], `MOVE
${arrows}Hit esc to dismiss
Use no modifier key to move ${INCREMENT_LOW} pixel.
Use the shift key to move ${INCREMENT_MID} pixels.
Use the option key to move ${INCREMENT_HIGH} pixels.
Use the cmd key to move to the edge of the screen.`)

// Resize mode (from right/down).
const resizeMode = new Shortcut('right', ['shift', 'ctrl', 'alt'], `RESIZE
${arrows}Hit esc to dismiss
Use no modifier key to resize ${INCREMENT_LOW} pixel.
Use the shift key to resize ${INCREMENT_MID} pixels.
Use the option key to resize ${INCREMENT_HIGH} pixels.
Use the cmd key to resize to the edge of the screen.`)

// ------------------------------------------------------------------------------
// Resize.

const resize = withFocusedWindow((window, increment, direction) => {
  const dimension = DIMENSIONS[AXES[direction]]
  const size = window.size()
  size[dimension] += increment * SIGNS[direction]
  window.setSize(size)
})

const resizeToEdge = withFocusedWindow((window, direction) => {
  const screenFrame = window.screen().flippedFrame()
  const topLeft = window.topLeft()
  const size = window.size()
  const frames = {
    right: {
      x: topLeft.x,
      y: topLeft.y,
      width: screenFrame.width - Math.abs(screenFrame.x - topLeft.x),
      height: size.height,
    },
    left: {
      x: screenFrame.x,
      y: topLeft.y,
      width: Math.abs(screenFrame.x - topLeft.x) + size.width,
      height: size.height,
    },
    up: {
      x: topLeft.x,
      y: screenFrame.y,
      width: size.width,
      height: Math.abs(window.screen().flippedVisibleFrame().y - topLeft.y) + size.height,
    },
    down: {
      x: topLeft.x,
      y: topLeft.y,
      width: size.width,
      height: screenFrame.height - Math.abs(screenFrame.y - topLeft.y),
    },
  }
  window.setFrame(frames[direction])
})

// ------------------------------------------------------------------------------
// Move.

const move = withFocusedWindow((window, increment, direction) => {
  const topLeft = window.topLeft()
  topLeft[AXES[direction]] += increment * SIGNS[direction]
  window.setTopLeft(topLeft)
})

const moveToEdge = withFocusedWindow((window, direction) => {
  const screenFrame = window.screen().flippedFrame()
  const topLeft = window.topLeft()
  const size = window.size()
  const axis = AXES[direction]
  const dimension = DIMENSIONS[axis]
  topLeft[axis] =
    SIGNS[direction] === 1 ? screenFrame[axis] + screenFrame[dimension] - size[dimension] : screenFrame[axis]
  window.setTopLeft(topLeft)
})

// Register the low/mid/high increment shortcuts and the cmd-to-edge shortcut
// for every direction, on both modes.
const MODIFIER_INCREMENTS = [
  { modifiers: [], increment: INCREMENT_LOW },
  { modifiers: ['shift'], increment: INCREMENT_MID },
  { modifiers: ['alt'], increment: INCREMENT_HIGH },
]

DIRECTIONS.forEach((direction) => {
  MODIFIER_INCREMENTS.forEach(({ modifiers, increment }) => {
    resizeMode.addSubShortcut(direction, modifiers, () => resize(increment, direction))
    moveMode.addSubShortcut(direction, modifiers, () => move(increment, direction))
  })
  resizeMode.addSubShortcut(direction, ['cmd'], () => resizeToEdge(direction))
  moveMode.addSubShortcut(direction, ['cmd'], () => moveToEdge(direction))
})

// ------------------------------------------------------------------------------
// Custom size/position shortcuts.

const maximise = withFocusedWindow((window) => window.maximise())

const center = withFocusedWindow((window) => {
  const screenFrame = window.screen().flippedVisibleFrame()
  window.setTopLeft({
    x: Math.trunc(screenFrame.x + (screenFrame.width - window.size().width) / 2),
    y: Math.trunc(screenFrame.y + (screenFrame.height - window.size().height) / 2),
  })
})

// Move and resize the window to the left half of the screen.
const half = withFocusedWindow((window) => {
  const screenFrame = window.screen().flippedFrame()
  window.setFrame({
    x: screenFrame.x,
    y: screenFrame.y,
    width: Math.trunc(screenFrame.width / 2),
    height: screenFrame.height,
  })
})

// ------------------------------------------------------------------------------
// The following are personal custom shortcuts which are heavily dependent
// on my current screen resolutions and sizes.

// Safari size/position.
const safariSize = withFocusedWindow((window) => {
  const screenFrame = window.screen().flippedVisibleFrame()
  window.setFrame({
    x: screenFrame.x + EXTRA_SPACE,
    y: screenFrame.y + EXTRA_SPACE,
    width: 1400,
    height: 900,
  })
})

// Safari (external monitor) size/position.
const safariExternalMonitorSize = withFocusedWindow((window) => {
  const screenFrame = window.screen().flippedVisibleFrame()
  window.setFrame({
    x: screenFrame.x + EXTRA_SPACE,
    y: screenFrame.y + EXTRA_SPACE,
    width: 2200,
    height: 1400,
  })
})

// Terminal position.
const terminalPosition = withFocusedWindow((window) => {
  const screenFrame = window.screen().flippedVisibleFrame()
  window.setTopLeft({
    x: screenFrame.x + EXTRA_SPACE,
    y: screenFrame.y + EXTRA_SPACE,
  })
})

const sharedSubShortcuts = [
  ['m', maximise],
  ['=', center],
  ['h', half],
  ['s', safariSize],
  ['f', safariExternalMonitorSize],
  ['t', terminalPosition],
]

sharedSubShortcuts.forEach(([key, cb]) => {
  resizeMode.addSubShortcut(key, [], cb)
  moveMode.addSubShortcut(key, [], cb)
})
