
const { getUser } = require('../utils/getUser');
const { createStatCard, quickMenuButtons } = require('../utils/theme');
const { dashboardArtAttachment, attachmentImageUrl } = require('../utils/art');

module.exports = {
  name: 'profile',
  async execute(msg) {
    const user = await getUser(msg.author.id);
    const art = dashboardArtAttachment(user);
    const embed = createStatCard(user, `<@${msg.author.id}>`).setImage(attachmentImageUrl(art));
    return msg.reply({
      embeds: [embed],
      files: [art],
      components: quickMenuButtons(msg.author.id),
    });
  }
};
