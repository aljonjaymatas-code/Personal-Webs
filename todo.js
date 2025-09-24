const SELECTORS = {
  newTask: document.getElementById('newTask'),
  addBtn: document.getElementById('addBtn'),
  taskList: document.getElementById('taskList'),
  filters: Array.from(document.querySelectorAll('.filters button')),
  remaining: document.getElementById('remaining'),
  clearCompleted: document.getElementById('clearCompleted'),
  emptyState: document.getElementById('emptyState')
}

let tasks = []
let filter = 'all'

// localStorage key
const STORAGE_KEY = 'todo.simple.list.v1'

function save() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(tasks))
}
function load() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    tasks = raw ? JSON.parse(raw) : []
  } catch (e) { tasks = [] }
}

function uid() { 
  return Date.now().toString(36) + Math.random().toString(36).slice(2, 7) 
}

function render() {
  SELECTORS.taskList.innerHTML = ''
  const visible = tasks.filter(t =>
    filter === 'all' || (filter === 'active' && !t.done) || (filter === 'completed' && t.done)
  )

  SELECTORS.emptyState.hidden = visible.length !== 0

  for (const t of visible) {
    const li = document.createElement('li')
    li.className = 'item' + (t.done ? ' done' : '')
    li.setAttribute('data-id', t.id)

    const cb = document.createElement('button')
    cb.className = 'checkbox'
    cb.setAttribute('aria-label', 'Toggle task')
    cb.addEventListener('click', () => toggleDone(t.id))
    cb.innerHTML = t.done ? '✓' : ''

    const span = document.createElement('div')
    span.className = 'text'
    span.textContent = t.text
    span.title = 'Double-click to edit'
    span.tabIndex = 0
    span.addEventListener('dblclick', () => editTask(t.id))
    span.addEventListener('keydown', (e) => { if (e.key === 'Enter') editTask(t.id) })

    const actions = document.createElement('div')
    actions.className = 'actions'

    const editBtn = document.createElement('button')
    editBtn.className = 'btn-ghost'
    editBtn.title = 'Edit'
    editBtn.innerText = 'Edit'
    editBtn.addEventListener('click', () => editTask(t.id))

    const delBtn = document.createElement('button')
    delBtn.className = 'btn-ghost'
    delBtn.title = 'Delete'
    delBtn.innerText = 'Delete'
    delBtn.addEventListener('click', () => removeTask(t.id))

    actions.appendChild(editBtn)
    actions.appendChild(delBtn)

    li.appendChild(cb)
    li.appendChild(span)
    li.appendChild(actions)

    SELECTORS.taskList.appendChild(li)
  }

  updateCounts()
}

function updateCounts() {
  const remaining = tasks.filter(t => !t.done).length
  SELECTORS.remaining.textContent = `${remaining} ${remaining === 1 ? 'item' : 'items'} left`
  save()
}

function addTask(text) {
  const clean = text.trim()
  if (!clean) return
  tasks.unshift({ id: uid(), text: clean, done: false })
  SELECTORS.newTask.value = ''
  render()
}

function toggleDone(id) {
  const t = tasks.find(x => x.id === id)
  if (!t) return
  t.done = !t.done
  render()
}

function removeTask(id) {
  tasks = tasks.filter(x => x.id !== id)
  render()
}

// 🔹 Updated inline editing
function editTask(id) {
  const li = SELECTORS.taskList.querySelector(`[data-id="${id}"]`)
  if (!li) return

  const task = tasks.find(t => t.id === id)
  if (!task) return

  const textEl = li.querySelector('.text')

  const input = document.createElement('input')
  input.type = 'text'
  input.value = task.text
  input.className = 'edit-input'

  li.replaceChild(input, textEl)
  input.focus()

  input.addEventListener('blur', () => {
    task.text = input.value.trim() || task.text
    render()
  })

  input.addEventListener('keydown', (e) => {
    if (e.key === 'Enter') input.blur()
  })
}

// Filters
for (const btn of SELECTORS.filters) {
  btn.addEventListener('click', () => {
    filter = btn.dataset.filter
    SELECTORS.filters.forEach(b => b.classList.remove('active'))
    btn.classList.add('active')
    render()
  })
}

SELECTORS.addBtn.addEventListener('click', () => addTask(SELECTORS.newTask.value))
SELECTORS.newTask.addEventListener('keydown', (e) => {
  if (e.key === 'Enter') addTask(SELECTORS.newTask.value)
})

SELECTORS.clearCompleted.addEventListener('click', () => {
  tasks = tasks.filter(t => !t.done)
  render()
})

// initialize
load()
render()
