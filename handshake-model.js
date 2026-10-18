(function (root) {
  'use strict';
  const create = () => ({ byte: 0xA1, edges: 0, accepted: 0, ready: false });
  const toggle = state => ({ ...state, ready: !state.ready });
  function step(state) {
    const transferred = state.ready;
    return {
      state: { ...state, edges: state.edges + 1, accepted: state.accepted + (transferred ? 1 : 0), byte: transferred ? (state.byte + 0x11) & 0xFF : state.byte },
      transferred,
      acceptedByte: transferred ? state.byte : null
    };
  }
  const api = { create, toggle, step };
  if (typeof module !== 'undefined' && module.exports) module.exports = api;
  else root.PortfolioHandshake = api;
})(typeof globalThis === 'undefined' ? this : globalThis);
