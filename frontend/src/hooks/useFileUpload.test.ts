import { renderHook, act, waitFor } from '@testing-library/react';
import { useFileUpload } from './useFileUpload';
import axios from 'axios';
import { toast } from 'react-toastify';
import { triggerDownloadBlob } from '@/utils/downloadBlob';
import { vi } from 'vitest';

// Mocking necessary modules
vi.mock('axios');
vi.mock('react-toastify', () => ({
  toast: {
    success: vi.fn(),
    warning: vi.fn(),
    error: vi.fn(),
  },
}));
vi.mock('@/utils/downloadBlob', () => ({
  triggerDownloadBlob: vi.fn(),
}));

describe('useFileUpload', () => {
  afterEach(() => {
    vi.clearAllMocks(); // Clear mocks after each test
  });

  it('should upload file and show success toast on successful upload', async () => {
    const file = new File(['content'], 'test.csv', { type: 'text/csv' });

    // Mock axios to simulate a successful response
    axios.post.mockResolvedValueOnce({ status: 201 });

    const { result } = renderHook(() => useFileUpload());

    await act(async () => {
      await result.current.handleFileUpload(file);
    });

    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(axios.post).toHaveBeenCalledWith(
      expect.anything(),
      expect.any(FormData),
      expect.any(Object)
    );
    expect(toast.success).toHaveBeenCalledWith('File uploaded successfully!');
  });

  it('should upload file and show warning toast when file upload has errors', async () => {
    const file = new File(['content'], 'test.csv', { type: 'text/csv' });

    // Mock axios to simulate a response with errors
    axios.post.mockResolvedValueOnce({
      status: 200,
      data: 'error details',
    });

    const { result } = renderHook(() => useFileUpload());

    await act(async () => {
      await result.current.handleFileUpload(file);
    });

    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(toast.warning).toHaveBeenCalledWith(
      'File failed to upload one (or) more transactions, check the file for more details'
    );
    expect(triggerDownloadBlob).toHaveBeenCalledWith('error details', 'errors.csv');
  });

  it('should show error toast on file upload failure', async () => {
    const file = new File(['content'], 'test.csv', { type: 'text/csv' });

    // Mock axios to simulate an error response
    axios.post.mockRejectedValueOnce(new Error('Network error'));

    const { result } = renderHook(() => useFileUpload());

    await act(async () => {
      await result.current.handleFileUpload(file);
    });

    expect(axios.post).toHaveBeenCalledTimes(1);
    expect(toast.error).toHaveBeenCalledWith('File upload failed');
  });

  it('should handle file upload with no file provided', async () => {
    const { result } = renderHook(() => useFileUpload());

    // Call handleFileUpload without a file
    await act(async () => {
      await result.current.handleFileUpload(null as unknown as File); // Simulate no file
    });

    // Ensure axios isn't called and no toast is shown
    expect(axios.post).not.toHaveBeenCalled();
    expect(toast.success).not.toHaveBeenCalled();
    expect(toast.error).not.toHaveBeenCalled();
  });
});
