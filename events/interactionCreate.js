const {
    ChannelType,
    PermissionFlagsBits,
    EmbedBuilder,
    ActionRowBuilder,
    ButtonBuilder,
    ButtonStyle
} = require('discord.js');

const STAFF_ROLE_ID = '1508444064360562760';
const CATEGORY_ID = '1506713600218103929';

module.exports = {
    name: 'interactionCreate',

    async execute(interaction) {

        if (!interaction.isButton()) return;

        if (interaction.customId === 'herspace_open') {

            const existing = interaction.guild.channels.cache.find(
                c => c.topic === interaction.user.id
            );

            if (existing) {
                return interaction.reply({
                    content: `💖 Kamu masih memiliki sesi verifikasi aktif: ${existing}`,
                    ephemeral: true
                });
            }

            const channel = await interaction.guild.channels.create({
                name: `🎀・${interaction.user.username}`,
                type: ChannelType.GuildText,
                parent: CATEGORY_ID,
                topic: interaction.user.id,
                permissionOverwrites: [
                    {
                        id: interaction.guild.id,
                        deny: [PermissionFlagsBits.ViewChannel]
                    },
                    {
                        id: interaction.user.id,
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.ReadMessageHistory
                        ]
                    },
                    {
                        id: STAFF_ROLE_ID,
                        allow: [
                            PermissionFlagsBits.ViewChannel,
                            PermissionFlagsBits.SendMessages,
                            PermissionFlagsBits.ReadMessageHistory
                        ]
                    }
                ]
            });

            const embed = new EmbedBuilder()
                .setColor('#F8BBD9')
                .setTitle('💖 Welcome to Her Space')
                .setDescription(`
Halo ${interaction.user} ✨

Terima kasih telah membuka sesi verifikasi.

Silakan kirim informasi yang diperlukan dan tunggu respon dari staff.

### Informasi Dasar
> 🌸 Nama
> 🎂 Umur
> 💬 Pesan atau pertanyaan

Channel ini bersifat private dan hanya dapat dilihat oleh kamu dan staff.
                `)
                .setFooter({
                    text: 'Verify Female • Private Verification'
                })
                .setTimestamp();

            const row = new ActionRowBuilder()
                .addComponents(
                    new ButtonBuilder()
                        .setCustomId('close_verification')
                        .setLabel('Close Session')
                        .setEmoji('🔒')
                        .setStyle(ButtonStyle.Secondary)
                );

            await channel.send({
                content: `${interaction.user} <@&${STAFF_ROLE_ID}>`,
                embeds: [embed],
                components: [row]
            });

            return interaction.reply({
                content: `✨ Session berhasil dibuat: ${channel}`,
                ephemeral: true
            });
        }

        if (interaction.customId === 'close_verification') {

            await interaction.reply({
                embeds: [
                    new EmbedBuilder()
                        .setColor('#F8BBD9')
                        .setDescription('🔒 Session akan ditutup dalam **5 detik**.')
                ]
            });

            setTimeout(async () => {
                await interaction.channel.delete().catch(() => {});
            }, 5000);
        }
    }
};