<script lang="ts">
  interface Props {
    previewUrl: string;
    driveUrl?: string;
    documentTitle: string;
  }

  let { previewUrl, driveUrl = '', documentTitle }: Props = $props();
  let modalElement: HTMLDialogElement | undefined = $state();

  function open() {
    modalElement?.showModal();
  }

  function close() {
    modalElement?.close();
  }

  function handleKeydown(e: KeyboardEvent) {
    if (e.key === 'Escape') close();
  }
</script>

<svelte:window onkeydown={handleKeydown} />

<button class="doc-btn" onclick={open} type="button">
  Consultar documento
</button>

<dialog bind:this={modalElement} class="doc-modal" onclick={(e) => { if (e.target === modalElement) close(); }}>
  <div class="modal-header">
    <h2>{documentTitle}</h2>
    <button class="modal-close" onclick={close} type="button" aria-label="Cerrar documento">×</button>
  </div>
  <iframe
    class="doc-frame"
    src={previewUrl}
    title={`Documento: ${documentTitle}`}
    loading="lazy"
  ></iframe>
  {#if driveUrl}
    <div class="modal-footer">
      <a class="drive-outlink" href={driveUrl} target="_blank" rel="noopener noreferrer">
        Abrir en Google Drive
      </a>
    </div>
  {/if}
</dialog>

<style>
  .doc-btn {
    background: transparent;
    border: 1px solid var(--accent);
    border-radius: 4px;
    color: var(--accent);
    cursor: pointer;
    font: inherit;
    font-weight: 600;
    font-size: 0.85rem;
    padding: 0.35rem 0.75rem;
  }

  .doc-btn:hover {
    background: var(--accent);
    color: #fffdf8;
  }

  .doc-modal {
    border: none;
    border-radius: 4px;
    max-width: min(92vw, 960px);
    max-height: min(92vh, 800px);
    padding: 0;
    width: 100%;
  }

  .doc-modal::backdrop {
    background: rgba(0, 0, 0, 0.5);
  }

  .modal-header {
    align-items: center;
    border-bottom: 1px solid var(--border);
    display: flex;
    justify-content: space-between;
    padding: 0.7rem 0.9rem;
  }

  .modal-header h2 {
    font-size: 0.9rem;
    font-weight: 600;
    margin: 0;
    overflow: hidden;
    text-overflow: ellipsis;
    white-space: nowrap;
  }

  .modal-close {
    background: none;
    border: none;
    cursor: pointer;
    font-size: 1.25rem;
    line-height: 1;
    padding: 0.15rem 0.3rem;
  }

  .doc-frame {
    border: none;
    height: 70vh;
    width: 100%;
  }

  .modal-footer {
    border-top: 1px solid var(--border);
    padding: 0.4rem 0.9rem;
    text-align: right;
  }

  .drive-outlink {
    color: var(--muted);
    font-size: 0.78rem;
    text-decoration: none;
  }

  .drive-outlink:hover {
    text-decoration: underline;
  }

  @media (max-width: 640px) {
    .doc-modal {
      max-height: 100vh;
      max-width: 100vw;
      border-radius: 0;
    }

    .doc-frame {
      height: 75vh;
    }
  }
</style>
