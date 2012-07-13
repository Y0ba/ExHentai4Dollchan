// ==UserScript==
// @name			ExHentai4Dollchan
// @version			1.0
// @namespace		https://github.com/Y0ba/ExHentai4Dollchan
// @author			Y0ba
// @description		Searches images on ExHentai (addon for Dollchan Extension Tools)
// @include			*
// ==/UserScript==

let W = new Uint32Array(80),
	A, B, C, D, E, temp,
	H0, H1, H2, H3, H4,
	K0 = 0x5a827999,
	K1 = 0x6ed9eba1,
	K2 = 0x8f1bbcdc,
	K3 = 0xca62c1d6,
	is_little_endian = !!(new Uint8Array(new Uint32Array([1]).buffer)[0]);

function rol32(x, n) {
	return (x << n) | (x >>> (32 - n));
}

function toHexStr(n) {
	let s = "", v;
	for(let i = 7; i >= 0; i--) {
		v = (n >>> (i * 4)) & 0xf;
		s += v.toString(16);
	}
	return s;
}

function sha_transform() {
	let t, temp, A = H0, B = H1, C = H2, D = H3, E = H4;
	for(t = 16; t < 80; t++) {
		W[t] = rol32(W[t - 3] ^ W[t - 8] ^ W[t - 14] ^ W[t - 16], 1);
	}
	
	for(t = 0; t < 20; t++) {
		temp = rol32(A, 5) + ((B & C) ^ (~B & D)) + E + W[t] + K0;
		E = D;
		D = C;
		C = rol32(B, 30);
		B = A;
		A = temp;
	}
	for(; t < 40; t++) {
		temp = rol32(A, 5) + (B ^ C ^ D) + E + W[t] + K1;
		E = D;
		D = C;
		C = rol32(B, 30);
		B = A;
		A = temp;
	}
	for(; t < 60; t++) {
		temp = rol32(A, 5) + ((B & C) ^ (B & D) ^ (C & D)) + E + W[t] + K2;
		E = D;
		D = C;
		C = rol32(B, 30);
		B = A;
		A = temp;
	}
	for(; t < 80; t++) {
		temp = rol32(A, 5) + (B ^ C ^ D) + E + W[t] + K3;
		E = D;
		D = C;
		C = rol32(B, 30);
		B = A;
		A = temp;
	}
	H0 += A;
	H1 += B;
	H2 += C;
	H3 += D;
	H4 += E;
}

function sha1Hash(buffer) {
	H0 = 0x67452301;
	H1 = 0xefcdab89;
	H2 = 0x98badcfe;
	H3 = 0x10325476;
	H4 = 0xc3d2e1f0;
	let len_, len = buffer.length,
		blocks = new Uint8Array(Math.ceil((len / 4 + 3) / 16) * 16 * 4);
	for (let i = len - 1; i >= 0; i--) {
		blocks[i] = buffer.charCodeAt(i);
	}
	blocks[len] = 0x80;
	blocks = new Uint32Array(blocks.buffer);
	len_ = blocks.length;
	if(is_little_endian) {
		for(let i = len_, x; i--;) {
			x = blocks[i];
			blocks[i] = (x >>> 24) | ((x<<8) & 0x00FF0000) | ((x >>> 8) & 0x0000FF00) | (x<<24);
		}
	}
	blocks[len_ - 2] = Math.floor(((len) * 8) / Math.pow(2, 32));
	blocks[len_ - 1] = ((len) * 8) & 0xffffffff;
	for(let i = 0; i < len_; i += 16){
		W.set(blocks.subarray(i, i + 16));
		sha_transform();
	}
	return toHexStr(H0) + toHexStr(H1) + toHexStr(H2) + toHexStr(H3) + toHexStr(H4);
}

window.addEventListener('message', function(e) {
	let data = e.data.split(';');
	if(data[0] !== '_ExHentai') {
		return;
	}
	GM_xmlhttpRequest({
		method: "GET",
		url: data[1],
		overrideMimeType: 'text/plain; charset=x-user-defined',
		onload: function(e) {
			if(e.status === 200) {
				GM_openInTab('http://exhentai.org/?f_shash=' + sha1Hash(e.responseText) + '&fs_similar=1&fs_exp=1', false, true);
			} else {
				GM_log('Error: ' + e.statusText);
			}
		}
	});
});

let attr = document.body.getAttribute('desu-image-search');
attr = attr ? attr + ';' : '';
document.body.setAttribute('desu-image-search', attr + 'ExHentai,');

let style = document.createElement('style');
style.type = 'text/css';
style.innerHTML = '.DESU_srcExHentai:before { content: ""; padding: 0 16px 0 0; margin: 0 4px; background: url(data:image/gif;base64,R0lGODlhEAAQAHMAACH/C05FVFNDQVBFMi4wAwEAAAAh+QQICgAAACwAAAAAEAAQAINmBhHi28oAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAAELjDISau9FWg9efCb9wESSGanaanjmr5cHMKkHJYnxYrdi7u/0aYXnBFbmKSyEgEAOw==) no-repeat center; }';
document.head.appendChild(style);