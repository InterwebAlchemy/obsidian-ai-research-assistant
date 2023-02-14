# Obsidian AI Research Assistant

![Forgetting a previous message](./docs/assets/forget-memory.png)

> Build better Prompts and AI integrations with this advanced research tool for Prompt Engineering.

**Note**: This plugin is still in active development and is not considered Stable yet. **This is Beta
software** and may contain bugs and other weird issues. Please report
[Issues](https:/github.com/InterwebAlchemy/obsidian-ai-research-assistant/issues) you find and feel
encouraged to [contribute](https://github.com/InterwebAlchemy/obsidian-ai-research-assistant/blob/main/docs/CONTRIBUTING.md) to the project. It has only been tested on Obsidian Desktop so far, but should have Obsidian Mobile support in the near future.

**Table of Contents**:

- [Obsidian AI Research Assistant](#obsidian-ai-research-assistant)
  - [Installation](#installation)
    - [BRAT Installation](#brat-installation)
    - [Manual Installation](#manual-installation)
  - [Currently Supported Models](#currently-supported-models)
  - [Upcoming Model Support](#upcoming-model-support)
  - [Summary](#summary)
  - [Features](#features)
  - [Roadmap](#roadmap)
  - [Naming Conventions](#naming-conventions)
  - [Memories](#memories)
    - [Memory States](#memory-states)

## Installation

This plugin is not yet available in the Obsidian Community Plugins directory, so you will need to
[install it manually](#manual-installation) or [install it via the Beta Reviewer's Auto-update Tool (BRAT)](#brat-installation)

### BRAT Installation

1. Install [BRAT](https://github.com/TfTHacker/obsidian42-brat)
2. Click the `Add Beta Plugin` button in BRAT's settings
3. Enter this repository's URL: `https://github.com/InterwebAlchemy/obsidian-ai-research-assistant`
4. Enable the plugin in Obsidian's Community Plugins settings
5. Configure `AI Research Assistant` in Obsidian's Settings

### Manual Installation

1. Download the latest
   [release](https://github.com/InterwebAlchemy/obsidian-ai-research-assistant/releases)
2. Unzip the release into your Obsidian vault's `plugins` folder
3. Enable the plugin in Obsidian's Community Plugins settings
4. Configure `AI Research Assistant` in Obsidian's Settings

## Currently Supported Models

- [OpenAI GPT-3](https://platform.openai.com/docs/models/gpt-3)
  - `text-davinci-003`

## Upcoming Model Support

- [OpenAI GPT-3](https://platform.openai.com/docs/models/gpt-3)
  - `text-curie-001`
- [OpenAPI Codex](https://platform.openai.com/docs/models/codex)
  - `code-davinci-002`
  - `code-cushman-001`
- [Cohere AI Models](https://docs.cohere.ai/reference/generate)

## Summary

This plugin integrates tools for Prompt Engineering and researching AI tools and language models
like OpenAI's GPT-3 into Obsidian.

![Basic interface and conversation summary](./docs/assets/basic-view.png)

It allows you to manually or automatically save your conversations with AI models, and then use
Obsidian's powerful search and tagging features to organize and analyze them.

![View the Preamble for the conversation](./docs/assets/preamble-summary.png)

If you enable the experimental Memory Manager, you can also live edit the conversational memories
that are used to provide context to each prompt.

![Marking a previous message as a Core Memory](./docs/assets/core-memory.png)

It allows you to review, search, tag, and link your conversations in Obsidian, and view a summary of
the conversation details its raw inputs and outputs.

![View the conversational exchange](./docs/assets/conversation-view.png)

![View the actual input sent to the API for requests](./docs/assets/raw-user-input.png)

![View the raw JSON from the API for responses](./docs/assets/raw-response.png)

## Features

- Save (automatically or manually) conversations with AI models to Obsidian notes
  - Conversations become searchable, taggagle, and linkable in Obsidian
- Live edit which previous messages are used as Context for each Prompt
  - Mark a message as a Core Memory to make sure it's always in the Context
  - Mark a message as a Forgotten to make sure it's never in the Context
  - Mark a message as Remembered to prioritize it's inclusion in the Context
- Live edit the Preamble that is used for each Conversation
- Live edit the Prompt that is used for each Conversation
- View the raw JSON from the API for each response
- View the prompt and context that was sent to the API for each request

## Roadmap

- **Resume Conversations** Load conversations from Obsidian notes to pick up where you left off
- **Annotate Conversations**: Incrementally update notes on save (instead of overwriting the whole note on each save)
- **Models & APIs**: [More models](#upcoming-model-support)
- **Token-aware Memories**: Memory will be constructed within the desired amount of tokens
- **Configurable Response Token Buffer**: Ensure that the API has enough tokens to respond to your prompts
- **Title Generator**: Automatically generate a title based on the conversation (like ChatGPT)
- **Mobile Support**: Use AI Research Assistant on your mobile devices, too
- **Conversation Presets**: Save and Load preset configurations of Prefix, Model, Preamble, Context, etc. to make it easier to explore different research threads
- **LangChain Support**: Integrate with [LangChain](https://langchain.readthedocs.io/) via [langchan.js](https://github.com/hwchase17/langchainjs)
- **Features You Want**: [Request a Feature](https://github.com/InterwebAlchemy/obsidian-ai-research-assistant/issues/new?assignees=&labels=enhancement&template=feature_request.md&title=%5BRequest%5D%3A+)

## Naming Conventions

This plugin uses the following naming conventions to refer to different pieces of a conversation and
make sure that it is always clear what is being referred to:

**Note**: This plugin makes a distinction between a `Prompt` and a `Preamble` because it can be used
to generate prompts for models without a Preamble and in that case it is harder to distinguish
between what you might be editing when you click on an `Edit Prompt` button.

- **Conversation**: This is an ongoing exchange of messages between the Human and the AI.
- **Preamble**: This is the initial instructions that a language model recieves. It is usually a
  short description of the topic of the conversation, and is used to provide context on how the
  model should behave, what the models knows, and how it should respond.
  - **Notable Examples**:
    - [ChatGPT](https://twitter.com/goodside/status/1598253337400717313)
    - [Perplexity AI](https://twitter.com/jmilldotdev/status/1600624362394091523)
    - [Bing Chat](https://twitter.com/kliu128/status/1623472922374574080)
- **Prompt**: Prompts are the questions that the model is asked to answer. They are usually a single
  sentence or a short paragraph.
  - **Notable Examples**:
    - [Emergent Mind](https://www.emergentmind.com/)
    - [OpenAI Examples](https://platform.openai.com/examples/)
- **Context**: Context is the memory that the model uses to generate its response. It usually
  consists of the Preamble and some previous messages (or summaries them), and older messages are
  eventually replaced by newer ones as the conversation progresses and tokens becomes more limited.
- **Prefixes**: Prefixes are prepended to a Prompt and are generally used to include a Start Word
  that identifies the start of a Prompt and a Handle that identifies the speaker.
- **Suffixes**: Suffixes are appended to a Prompt and are generally used to include a Stop Word that
  identifies the end of a Prompt.
- **Handles**: Handles are short identifiers used to differentiate between speakers in the Context.
  By default this plugin uses `You:` to represent the Human and `AI:` to represent the AI model. You
  can change these prefixes in the AI Research Assistant settings.
- **Memories**: When [Memories](#memories) are enabled, the Context is generated from the Preamble
  and a defined number of previous messages. If the experimental Memory Manager is enabled, you can
  edit the Context in real time for each Prompt by defining memory staties for previous messages.

## Memories

Memories give your Conversation context and allow the language model to use what's already been said
to inform future responses.

There are four different [Memory States](#memory-states), and each message can have one of them:

You can manage the Memories of a Conversation in real time by clicking on the Memory State button
next to each message bubble and choosing a new state for that memory.

### Memory States

- **Default**: By default, messages are **somtimes** remembered (in reverse chronological order),
  the most recent Memories are most likely to be remembered and older Memories are the first to be
  excluded frm the Conversation's Context. These Memories follow a basic First In First Out (FIFO)
  queue.
- **Core Memory**: Core Memories are **always** included in the Conversation's Context. They are
  usually the most important messages in the conversation and are used to provide consistent Context
  for the model. They do not count towards the maximum number of memories for a Conversation
  configured in the plugin's settings.
- **Remembered**: Remembered Memories **often** included in the Conversation's Context, until your
  Conversation reaches the maximum number of memories configured in the plugin's settings. They are
  usually more important messages, but not as important as Core Memories. They do count towards the
  maximum number of memories, and are accessed in reverse chronological order. If the maximum number
  of memories is reached, the oldest Remembered Memories will not be included in the Context.
- **Forgotten**: Forgotten Memories are **never** included in the Conversation's Context. You can
  forget a Memory at any time during the Conversation, and also restore Forgotten Memories to
  another Memory State.
