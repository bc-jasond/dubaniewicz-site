<script>
  export let node = Map();
  // TODO use a store() ?
  export let isEditing = false;
  export let setEditNodeId = undefined;

  import { Map } from 'immutable';

  import { LINKED_LIST_NODE_ID } from '@filbert/linked-list';
  import { NODE_TYPE_SPACER } from '@filbert/document';

  // assume we're editing if there's a setEditNodeId callback
  $: isEditMode = !!setEditNodeId;
  $: id = node.get(LINKED_LIST_NODE_ID);
</script>

<style>
  section {
    margin-bottom: 56px;
    font-family: var(--alt-font-family);
    font-size: var(--alt-font-size);
    line-height: var(--alt-line-height);
    letter-spacing: var(--alt-letter-spacing);
  }
  section::after {
    content: '✎﹏﹏﹏﹏﹏﹏﹏﹏﹏';
    text-align: center;
    display: block;
    margin: 0 auto;
    width: 266px;
  }
</style>

<svelte:options immutable />
<section
  class="filbert-section"
  class:edit-section-border="{isEditing}"
  class:edit-hover-border="{isEditMode}"
  data-type="{NODE_TYPE_SPACER}"
  name="{id}"
  on:click="{() => setEditNodeId?.(id)}"
></section>
