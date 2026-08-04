export type Item = {
  id: number;
  name: string;
};

const state = {
  items: [
    { id: 1, name: "키보드" },
    { id: 2, name: "마우스" },
  ] as Item[],
  nextId: 3,
};

export function listItems(): Item[] {
  return state.items;
}

export function getItem(id: number): Item | undefined {
  return state.items.find((i) => i.id === id);
}

export function createItem(name: string): Item {
  const item = { id: state.nextId, name };
  state.nextId += 1;
  state.items = [...state.items, item];
  return item;
}

export function deleteItem(id: number): boolean {
  const before = state.items.length;
  state.items = state.items.filter((i) => i.id !== id);
  return state.items.length < before;
}
