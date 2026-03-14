const OpenAI = require('openai');

if (!process.env.OPENAI_API_KEY) {
	// Provide a lightweight stub so the app can start in environments
	// without an OpenAI key (useful for local dev without secrets).
	module.exports = {
		chat: {
			completions: {
				create: async () => ({
					choices: [{ message: { content: JSON.stringify({ message: 'OpenAI disabled', collected_data: null, is_complete: false }) } }],
					usage: { total_tokens: 0 },
				}),
			},
		},
		audio: {
			transcriptions: {
				create: async () => ({ text: '' }),
			},
			speech: {
				create: async () => ({ arrayBuffer: async () => new ArrayBuffer(0) }),
			},
		},
	};
} else {
	module.exports = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });
}
