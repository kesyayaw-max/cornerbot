const {
    SlashCommandBuilder,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle,
    PermissionFlagsBits
} = require('discord.js');

module.exports = {
    data: new SlashCommandBuilder()
        .setName('herspace')
        .setDescription('verification panel')
        .setDefaultMemberPermissions(PermissionFlagsBits.Administrator),

    async execute(interaction) {

        const embed = new EmbedBuilder()
            .setColor('#F8BBD9')
            .setTitle('💖 Open Verification')
            .setDescription(`
Verify dulu yuk, buat kamu yang mau dapetin role female✨
Nantinya akan dibantu staff yang bertugas dalam memberikan role tersebut yaa👋🏻

• ✨ Khusus member perempuan.
• 💬 Gunakan identitas yang sesuai.
• 🌷 Hormati sesama member.
• 🔒 Ikuti aturan komunitas yang berlaku.

Terima kasih telah bergabung! 💖

            `)
            .setImage('https://media.discordapp.net/attachments/1506702714371969149/1516510707300958418/WhatsApp_Image_2026-05-29_at_09.27.33_1.jpeg?ex=6a32e828&is=6a3196a8&hm=f95c126d673560269bfcaacbeec1e1466f2f4fd3b2ec6ae18293d6d00522c2a5&=&format=webp&width=1093&height=546') // Ganti banner kamu
            .setFooter({
                text: 'Verify Female • Cosmic Corner'
            })
            .setTimestamp();

        const row = new ActionRowBuilder()
            .addComponents(
                new ButtonBuilder()
                    .setCustomId('herspace_open')
                    .setLabel('Open Verification')
                    .setEmoji('💖')
                    .setStyle(ButtonStyle.Success)
            );

        await interaction.reply({
            embeds: [embed],
            components: [row]
        });
    }
};