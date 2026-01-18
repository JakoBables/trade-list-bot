const { Client, GatewayIntentBits, SlashCommandBuilder, REST, Routes, EmbedBuilder } = require("discord.js");
const fs = require("fs");

const TOKEN = process.env.TOKEN;
const CLIENT_ID = process.env.CLIENT_ID;

const client = new Client({
  intents: [GatewayIntentBits.Guilds]
});

const commands = [
  new SlashCommandBuilder()
    .setName("settradelist")
    .setDescription("Upload an image of your trade wishlist!")
    .addAttachmentOption(option =>
      option.setName("image")
        .setDescription("Upload your image")
        .setRequired(true)
    ),

  new SlashCommandBuilder()
    .setName("tradelist")
    .setDescription("View a user's trade list")
    .addUserOption(option =>
      option.setName("user")
        .setDescription("Select a user")
        .setRequired(true)
    )
];

const rest = new REST({ version: "10" }).setToken(TOKEN);

(async () => {
  try {
    await rest.put(
      Routes.applicationCommands(CLIENT_ID),
      { body: commands }
    );
    console.log("✅ Slash commands registered");
  } catch (error) {
    console.error(error);
  }
})();

client.on("interactionCreate", async interaction => {
  if (!interaction.isChatInputCommand()) return;

  const data = JSON.parse(fs.readFileSync("./data.json"));

  // UPLOAD
  if (interaction.commandName === "settradelist") {
    const image = interaction.options.getAttachment("image");

    data[interaction.user.id] = image.url;
    fs.writeFileSync("./data.json", JSON.stringify(data, null, 2));

    return interaction.reply({
      content: "✅ Your trade list has been saved!",
      ephemeral: true
    });
  }

  // VIEW
  if (interaction.commandName === "tradelist") {
    const user = interaction.options.getUser("user");

    if (!data[user.id]) {
      return interaction.reply({
        content: "❌ This user has not uploaded a trade list yet.",
        ephemeral: true
      });
    }

    const embed = new EmbedBuilder()
      .setTitle(`${user.username}'s Trade List`)
      .setImage(data[user.id])
      .setColor(0x2ecc71);

    return interaction.reply({ embeds: [embed] });
  }
});

client.login(TOKEN);
