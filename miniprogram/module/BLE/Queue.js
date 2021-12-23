class Queue {
  items = []

  constructor() {}

  enqueue(item) {
    this.items.push(item)
  }

  dequeue(element) {
    return this.empty() ? null : this.items.shift()
  }

  size() {
    return this.items.length
  }

  first() {
    return this.empty() ? null : this.items[0]
  }

  empty() {
    return this.items.length == 0 ? true : false
  }

  clear() {
    this.items = []
  }

}

export {
  Queue
}