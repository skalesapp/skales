// Simple Jest test mocking Chrome API
global.chrome = {
  runtime: {
    sendMessage: jest.fn(),
    onMessage: {
      addListener: jest.fn()
    }
  },
  storage: {
    local: {
      get: jest.fn(),
      set: jest.fn()
    }
  }
};

describe('Extension Chrome APIs', () => {
  it('should have mock for chrome.runtime.sendMessage', () => {
    chrome.runtime.sendMessage({ type: 'TEST' });
    expect(chrome.runtime.sendMessage).toHaveBeenCalledWith({ type: 'TEST' });
  });
});
