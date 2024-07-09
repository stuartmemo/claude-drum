import Anthropic from '@anthropic-ai/sdk';

const anthropic = new Anthropic({
  apiKey: 'xxxxxx', // defaults to process.env["ANTHROPIC_API_KEY"]
});

const parseToJSON = (input: string): object => {
  try {
    // Remove newline characters and extra spaces
    const cleanedInput = input.replace(/\s+/g, ' ').trim();

    // Parse the cleaned input string as JSON
    const parsedJSON = JSON.parse(cleanedInput);

    return parsedJSON;
  } catch (error) {
    console.error('Error parsing input:', error);
    return {};
  }
};

const generateBeat = async (req, res) => {
  const response = await anthropic.messages.create({
    model: 'claude-3-5-sonnet-20240620',
    max_tokens: 1000,
    temperature: 0,
    system:
      '<context>\nYou are a drum machine pattern generator. You have the following drum sounds at your disposal:\nkick\nsnare\ntom-low\ntom-mid\ntom-high\nrimshot\nclap\ncowbell\ncymbal\nhat-open\nhat-closed\n\nAnd the following drum kits:\npop\nrock\nlinndrum\ntr-808\ntr-909\n</context>\n\n<instructions>\nWhen requested to create a drum beat, create a pattern using json.\n<example>\n{\n  "name": "Hip-hop beat",\n  "bpm": 120,\n  "kit": "808",\n  "kick": [true, false, false, false, true, false, false, false, true, false, false, false, true, false, false, false],\n  "snare": [false, false, true, false, false, false, true, false, false, false, true, false, false, false, true, false]\n}\n</example>\n\nReturn no other text.\n</instructions>',
    messages: [
      {
        role: 'user',
        content: [
          {
            type: 'text',
            text: req.body.message,
          },
        ],
      },
    ],
  });

  const responseJSON = parseToJSON(response.content[0].text);
  res.status(200).json(responseJSON);
};

export default generateBeat;
