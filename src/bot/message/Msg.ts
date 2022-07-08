import { Channel, User } from "discord.js";

export interface Msg {
  id: string;
  content: string;
  channel: Channel;
  author: User;
}
