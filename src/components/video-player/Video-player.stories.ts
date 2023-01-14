import { html } from 'lit'
import { Meta, StoryObj } from '@storybook/web-components'
import type { VideoPlayer } from './Video-player.component'
import './Video-player.component'

export default {
  title: 'Video Player',
  component: 'video-player',
  tags: ['autodocs'],
  render: (args) => html`<video-player></video-player>`,
} as Meta

export const Default: StoryObj<VideoPlayer> = {
}
