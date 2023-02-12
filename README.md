# Obsidian AI Research Assistant

This plugin integrates tools for Prompt Engineering and researching AI tools and language models
like OpenAI's GPT-3 into Obsidian.

It allows you to manually or automatically save your conversations with AI models, and then use
Obsidian's powerful search and tagging features to organize and analyze them.

If you enable the experimental Memory Manager, you can also live edit the conversational memories
that are used to provide context to each prompt.

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
- **Memories**: When Memories are enabled, the Context is generated from the Preamble and a defined
  number of previous messages. If the experimental Memory Manager is enabled, you can edit the
  Context in real time for each Prompt by defining memory staties for previous messages.
  - **Memory States**:
    - **Default**: By default, messages are remembered in reverse chronological order, the most
      recent messages are most likely to be remembered and older messages are the first to be
      forgotten. These memories follow a basic First In First Out (FIFO) queue.
    - **Core Memory**: Core Memories are messages that are remembered indefinitely . They are
      usually the most important messages in the conversation and are used to provide context for
      the model. They are not forgotten, and do not count towards the maximum number of memories.
    - **Remembered**: Remembered Memories are messages that are remembered for a limited amount of
      time. They are usually more important messages, but not as important as Core Memories. They do
      count towards the maximum number of memories, and are accessed in reverse chronological order.
      If the maximum number of memories is reached, the oldest Remembered Memories will not be
      included in the Context.
    - **Forgotten**: Forgotten Memories are never included in the Conversation's Context.
  - **Memory Management**: You can manage the Memories of a Conversation in real time by clicking on
    the Memory State button next to each message bubble and choosing a new state for that memory.
