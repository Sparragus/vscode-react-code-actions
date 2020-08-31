# React Code Actions
A set of code actions that help you write code faster.

Write JSX without worrying if the component you are using exists. If it doesn't, you can place the cursor on top of the component name, press `Cmd+.`, and open the code actions panel. If the component is not referenced, various options will be provided.

The new component will contain placeholder code. If necessary, the component will also be imported to the current file.

This allows you to write working code the way you intended to write it.

## How it works
Consider this code:

```jsx
function Layout() {
  return (
    <div>
      ...
      <Navbar />
    </div>
  )
}
```

The developer has the cursor in the name of the component they want to create, or if the component name is partially or fully selected (and nothing else). Code actions will be available if:

1. The keyword is the name of a component
2. The component name is capitalized (in order to avoid html elements)
3. The component is not referenced anywhere in the file

The following code actions will be available:

- New component in the same file
- New component in the same folder
- New component in the components folder
