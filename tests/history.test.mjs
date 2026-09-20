import assert from 'node:assert/strict';
import { I, k } from '../src/vendor/codemirror-bundle.js';
import { modalHistoryField, modalUndo, modalRedo } from '../src/editor/engine.js';

export function runHistoryTests() {
  console.log('--- Running Modal Editor History (Undo/Redo) Tests ---');

  function createTestEditor(initialDoc = '') {
    let state = I.create({
      doc: initialDoc,
      extensions: [modalHistoryField]
    });
    const view = {
      state,
      dispatch(tr) {
        this.state = this.state.update(tr).state;
      }
    };
    return view;
  }

  // Test 1: Empty history returns false
  {
    const view = createTestEditor('Hello world');
    assert.equal(modalUndo(view), false, 'Undo on fresh editor should return false');
    assert.equal(modalRedo(view), false, 'Redo on fresh editor should return false');
    assert.equal(view.state.doc.toString(), 'Hello world');
    console.log('  ✓ Test 1: Empty history returns false');
  }

  // Test 2: Simple edit, undo, redo
  {
    const view = createTestEditor('Hello');
    view.dispatch({ selection: k.cursor(5) });
    view.dispatch({
      changes: { from: 5, to: 5, insert: ' world' },
      selection: k.cursor(11)
    });
    assert.equal(view.state.doc.toString(), 'Hello world');

    const undoSuccess = modalUndo(view);
    assert.equal(undoSuccess, true, 'modalUndo should succeed');
    assert.equal(view.state.doc.toString(), 'Hello', 'Doc should be restored to Hello');
    assert.equal(view.state.selection.main.head, 5, 'Cursor should be restored to position 5');

    const redoSuccess = modalRedo(view);
    assert.equal(redoSuccess, true, 'modalRedo should succeed');
    assert.equal(view.state.doc.toString(), 'Hello world', 'Doc should be redone to Hello world');
    assert.equal(view.state.selection.main.head, 11, 'Cursor should be redone to position 11');
    console.log('  ✓ Test 2: Simple edit, undo, redo');
  }

  // Test 3: Multiple distinct edits (with newlines / time)
  {
    const view = createTestEditor('');
    view.dispatch({
      changes: { from: 0, to: 0, insert: 'line 1\n' },
      selection: k.cursor(7)
    });
    view.dispatch({
      changes: { from: 7, to: 7, insert: 'line 2\n' },
      selection: k.cursor(14)
    });
    view.dispatch({
      changes: { from: 14, to: 14, insert: 'line 3' },
      selection: k.cursor(20)
    });
    assert.equal(view.state.doc.toString(), 'line 1\nline 2\nline 3');

    // Undo line 3
    assert.equal(modalUndo(view), true);
    assert.equal(view.state.doc.toString(), 'line 1\nline 2\n');

    // Undo line 2
    assert.equal(modalUndo(view), true);
    assert.equal(view.state.doc.toString(), 'line 1\n');

    // Undo line 1
    assert.equal(modalUndo(view), true);
    assert.equal(view.state.doc.toString(), '');

    // Undo when empty returns false
    assert.equal(modalUndo(view), false);

    // Redo all three
    assert.equal(modalRedo(view), true);
    assert.equal(view.state.doc.toString(), 'line 1\n');
    assert.equal(modalRedo(view), true);
    assert.equal(view.state.doc.toString(), 'line 1\nline 2\n');
    assert.equal(modalRedo(view), true);
    assert.equal(view.state.doc.toString(), 'line 1\nline 2\nline 3');
    assert.equal(modalRedo(view), false);
    console.log('  ✓ Test 3: Multiple distinct edits with step-by-step undo/redo');
  }

  // Test 4: Typing after undo clears redo stack
  {
    const view = createTestEditor('initial');
    view.dispatch({
      changes: { from: 7, to: 7, insert: ' A' },
      selection: k.cursor(9)
    });
    assert.equal(modalUndo(view), true);
    assert.equal(view.state.doc.toString(), 'initial');

    // New edit should invalidate redo of ' A'
    view.dispatch({
      changes: { from: 7, to: 7, insert: ' B' },
      selection: k.cursor(9)
    });
    assert.equal(view.state.doc.toString(), 'initial B');
    assert.equal(modalRedo(view), false, 'Redo stack should be empty after new edit');

    assert.equal(modalUndo(view), true);
    assert.equal(view.state.doc.toString(), 'initial');
    console.log('  ✓ Test 4: Typing after undo invalidates redo stack');
  }

  // Test 5: Formatting tool simulation (wrapping text in markdown)
  {
    const view = createTestEditor('Hello Important World');
    // Select "Important" (from 6 to 15) and wrap with **
    view.dispatch({
      changes: { from: 6, to: 15, insert: '**Important**' },
      selection: k.cursor(19)
    });
    assert.equal(view.state.doc.toString(), 'Hello **Important** World');

    assert.equal(modalUndo(view), true);
    assert.equal(view.state.doc.toString(), 'Hello Important World');
    assert.equal(modalRedo(view), true);
    assert.equal(view.state.doc.toString(), 'Hello **Important** World');
    console.log('  ✓ Test 5: Formatting tool changes can be undone and redone cleanly');
  }

  // Test 6: Deletions (backspace/selection delete) can be undone
  {
    const view = createTestEditor('Some content to delete');
    // Delete "content to "
    view.dispatch({
      changes: { from: 5, to: 16, insert: '' },
      selection: k.cursor(5)
    });
    assert.equal(view.state.doc.toString(), 'Some delete');

    assert.equal(modalUndo(view), true);
    assert.equal(view.state.doc.toString(), 'Some content to delete');
    assert.equal(modalRedo(view), true);
    assert.equal(view.state.doc.toString(), 'Some delete');
    console.log('  ✓ Test 6: Deletion operations undo and redo correctly');
  }

  console.log('All modal editor history tests passed successfully!\n');
}
