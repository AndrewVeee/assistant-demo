# Always on AI Assistant Demo

This is an early demo of some of the possibilities of an always-on AI assistant. This is only
scratching the surface to explore what an open source always-on assistant can/should do.

https://github.com/AndrewVeee/assistant-demo/assets/153542699/f7c4f149-b3e5-474c-925f-b570b941b824

# Try It Out

## Requirements:

The only requirement is an OpenAI-compatible API (through oobabooga, llama.cpp, etc).

## Usage:

- Download the zip file from the releases page: https://github.com/AndrewVeee/assistant-demo/releases/tag/demo-0.1
- Unzip and open the `index.html` file in your browser.
- Click the "API" button at the top to set your API url (eg http://localhost:8000).
- If you use an API that requires a key (like OpenAI), click Set Key to paste in the key.
  
  Note: This has been tested with `openhermes-2.5-mistral-7b.Q6_K.gguf` and prompt chains may require tweaking for other models.

You should be ready to go.

## What to try:

Keep in mind this is a tech demo, so the stream entries aren't saved when you close the tab.

- **"Live" Feed:** In the Stream tab, you can click "Add Entry" at the top. You can paste in content, or use one of the examples at the top. When the content is filled, click Add. (Keep it kind of short - it doesn't check context length!)
- **AI Feed:** Once you've added an entry, click "Run Message Handler" under the new entry and watch the AI categorize, summarize, extract invoice info from bills, and suggest responses to personal messages!
- **Chat** with the AI in the Log section on the right. There's some fake "web data" about the weather, sports, politics, and AI news if you ask it ;-)
  - Note: This does not include chat history/context, it is only a demo of using a prompt chain to reply.
  - If you ask it to perform a task, it should make a bullet list that includes "assistants" it should use and instructions for each. (Example: Check the weather and add a to do list item of what to wear today.)
- **Give it a Personality:** Click the "Personality" button at the top right to write a short sentence about how the AI should act and response to you.

## To Do list:

This is an older UI to play with the idea of an AI breaking down your tasks and helping you complete them. Don't expect much here, but I think having access to a to do list would be crucial to a useful AI assistant.

## Prompts:

I'm pretty sure this is too confusing to actually use, but you can get a sense for the structure of prompt chains, or view/edit the prompts. This is also not saved when the browser is closed.

# What Next?

I'm excited about the possibilities and hope it leads to a cool project (or even interoperable projects!) to create an always-on assistant. I'm personally thinking about:

- A server to build on these ideas with a feed/stream of data.
- Prompt chains that can be flexible in allowing code and user customization, triggered by feeds, calendars, UI interaction (chat, to do, stream), etc.
- Prompts that work with the smallest models, so even the tiniest LLMs and cpu-only computers can run a full local assistant.
- A fluid context system that can use chat history, stream data, and project/thought context to give well-rounded awareness.
- Pluggable tools to give access to different systems, like email, texts, and social media streams, and tools like contact lists and calendars.
- Function calling via prompt chains so small models can handle it.
