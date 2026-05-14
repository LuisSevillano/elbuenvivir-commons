<script lang="ts">
  interface Props {
    previewUrl: string;
    documentTitle: string;
  }

  let { previewUrl, documentTitle }: Props = $props();
  let modalElement: HTMLDialogElement | undefined = $state();

  function open() {
    modalElement?.showModal();
  }

  function close() {
    modalElement?.close();
  }

  function handleBackdrop(e: MouseEvent) {
    if (e.target === modalElement) close();
  }
</script>

<button class="drive-btn preview" onclick={open} type="button">
  Vista rápida
</button>

<dialog bind:this={modalElement} class="drive-modal" onclick={handleBackdrop}>
  <div class="modal-header">
    <h2>{documentTitle}</h2>
    <button class="modal-close" onclick={close} type="button" aria-label="Cerrar">×</button>
  </div>
  <iframe
    class="drive-frame"
    src={previewUrl}
    title={`Vista previa de ${documentTitle}`}
    allow="autoplay"
    loading="lazy"
  ></iframe>
</dialog>

<style>
  .drive-btn {
    border-radius: 4px;
    cursor: pointer;
    font: inherit;
    font-weight: 700;
    padding: 0.55rem 1rem;
    text-decoration: none;
  }

  .drive-btn.preview {
    background: transparent;
    border: 1px solid var(--accent);
    color: var(--accent);
  }

  .drive-btn.preview:hover {
    background: var(--accent);
    color: #fffdf8;
  }

  .drive-modal {
    border: none;
    border-radius: 4px;
    max-width: min(90vw, 900px);
    max-height: min(90vh, 700px);
    padding: 0;
    width: 100%;
  }

  .drive-modal::backdrop {
    background: rgba(0, 0, 0, 0.45);
  }

  .modal-header {
    align-items: center;
    border-bottom: 1px solid var(--border);
    display: flex;
    justify-content: space-between;
    padding: 0.75rem 1rem;
  }

  .modal-header h2 {
    font-size: 0.95rem;
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
    font-size: 1.3rem;
    line-height: 1;
    padding: 0.25rem;
  }

  .drive-frame {
    border: none;
    height: 65vh;
    width: 100%;
  }
</style>
