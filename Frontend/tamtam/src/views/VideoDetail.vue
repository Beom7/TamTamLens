<template>
  <section class="grid-container">
    <!-- Timeline Card -->
    <article class="card timeline-card">
      <!-- Timeline background bar -->
      <div class="timeline-section">
        <div class="timeline-background-bar" v-if="videoData.video_record">
          <!-- Timeline Records -->
          <div v-for="(company, company_index) in videoData.video_record.slice(0, 4)" :key="company._id">
            <ul v-for="(record, record_index) in company.timelines" :key="record_index">
              <div
                :class="{ 'display-none': focusedCompany && focusedCompany !== company.company_id.company_nickname }"
              >
                <li
                  :id="'record-' + company_index + '-' + record_index"
                  :class="`timeline-record background-` + company_index"
                  @click="playerSeekTo(record[1])"
                />
              </div>
            </ul>
          </div>
          <div v-if="videoData.video_record.length > 4">
            <div v-for="(company, company_index) in videoData.video_record.slice(4)" :key="company._id">
              <ul v-for="(record, record_index) in company.timelines" :key="record_index">
                <div :class="{ 'display-none': focusedCompany && focusedCompany !== 'etc' }">
                  <li
                    :id="'record-' + (Number(company_index) + 4) + '-' + record_index"
                    class="timeline-record background-4"
                    @click="playerSeekTo(record[1])"
                  />
                </div>
              </ul>
            </div>
          </div>
        </div>
      </div>

      <!-- Timestamp -->
      <div class="timestamp-section">
        <span class="timestamp-default">00:00</span>
        <span id="timestamp-info"></span>
        <span class="timestamp-default">{{ makeVideoTime(videoData.video_time) }}</span>
      </div>

      <!-- Company Toggle -->
      <div class="company-toggle-section" v-if="videoData.video_record">
        <div
          v-for="(company, company_index) in videoData.video_record.slice(0, 4)"
          :id="'company-button-' + company_index"
          :key="company._id"
          :class="`company-button toggle-unselected selected-` + company_index"
          @click="choiceCompany(company_index, company.company_id.company_nickname)"
        >
          <span>{{ company_index + 1 }}. {{ company.company_id.company_name }}</span>
          <span>{{ parseInt((company.total_exposure_time / allExposureTime) * 100) }}%</span>
        </div>
        <div v-if="videoData.video_record.length > 4" class="etc-button">
          <div
            id="company-button-4"
            class="company-button toggle-unselected selected-4"
            @click="choiceCompany(4, 'etc')"
          >
            기타 등장 브랜드
          </div>
        </div>
      </div>
    </article>

    <!-- Video Card -->
    <article class="card video-card">
      <div id="yt-player-serction" class="video-player-section">
        <div id="yt-player" />
      </div>
      <div class="video-info-section">
        <p class="video-category">{{ videoData.video_category }}</p>
        <p class="video-title">{{ videoData.video_title }}</p>
        <div class="video-small" style="color: gray;">
          <span>
            <span>조회수 {{ videoData.video_views }}회 • </span>
            <span>{{ videoData.video_date }}</span>
          </span>
          <span>
            <span>좋아요: {{ videoData.video_like }} /</span>
            <span> 싫어요: {{ videoData.video_dislike }}</span>
          </span>
        </div>
        <v-divider></v-divider>
        <div class="video-buttons">
          <div class="video-channel" @click="moveChannelDetail(videoData.channel_id.channel_youtube_id)">
            <v-avatar class="channel-avatar">
              <img :src="videoData.channel_id.channel_img" :alt="videoData.channel_id.channel_name" />
            </v-avatar>
            <div>
              <div>{{ videoData.channel_id.channel_name }}</div>
              <div style="color: gray;">{{ subscribeCnt(videoData.channel_id.channel_subscribe) }}</div>
            </div>
          </div>
          <div class="video-buttons">
            <img
              class="video-youtube-button"
              @click="moveYoutubeVideo(videoData.video_url)"
              src="https://w.namu.la/s/063c36f7fa7b39e21e386ac10a4909cd364f7347f2a2629bdd08acd0a7ad62552d39b611960605f1832d8b9505d9b4fe05e0b29692d7016e5d65770c209a830948a6cdff2c50a5d42e92b1950c8f1c854e12c80e6eb4061df54c8904361e8207"
            />
            <v-btn
              class="video-button scrap-button"
              v-show="!show"
              color="green"
              small
              style="color: white;"
              @click="scrapVideo()"
            >
              동영상 스크랩
            </v-btn>
            <v-btn
              class="video-button scrap-button"
              v-show="show"
              color="green"
              small
              style="color: white;"
              @click="scrapVideo()"
            >
              동영상 스크랩 취소
            </v-btn>
            <v-btn class="video-button exception-button" small color="error">동영상 통계 제외</v-btn>
          </div>
        </div>
        <p>{{ videoData.video_content }}</p>
      </div>
    </article>

    <!-- Recommandation Card -->
    <article class="card recommend-video-card">
      <RecommendVideoList />
    </article>
  </section>
</template>

<script>
import { mapActions, mapState } from 'vuex'
import router from '@/router'
import cookies from 'vue-cookies'
import RecommendVideoList from '@/components/VideoDetailComponents/RecommendVideoList.vue'

export default {
  name: 'VideoDetail',
  components: {
    RecommendVideoList
  },
  data() {
    return {
      player: {},
      focusedCompany: false,
      show: false,
      companyid: cookies.get('companyId'),
      videoTime: '',
      allExposureTime: 0
    }
  },
  computed: {
    ...mapState('videoDetailStore', ['videoData', 'recommendVideos'])
  },
  async created() {
    // videoData 불러오기
    await this.getVideoData(this.$route.params.video_youtube_id)

    // videoData 불러오기
    await this.getRecommendVideoData()

    // youtube iframe 만들기
    const tag = document.createElement('script')
    tag.src = 'https://www.youtube.com/iframe_api'
    const firstScriptTag = document.getElementsByTagName('script')[0]
    firstScriptTag.parentNode.insertBefore(tag, firstScriptTag)

    if (!window.onYouTubeIframeAPIReady) {
      window.onYouTubeIframeAPIReady = () => {
        this.makePlayerObject(this.videoData.video_youtube_id)
      }
    } else {
      this.makePlayerObject(this.videoData.video_youtube_id)
    }

    // 자동재생 설정
    window.onPlayerReady = event => {
      event.target.playVideo()
    }

    // youtube iframe CSS 적용하기
    const playerElement = document.getElementById('yt-player')
    playerElement.style.position = 'absolute'
    playerElement.style.width = '100%'
    playerElement.style.height = '100%'
    playerElement.style.borderRadius = '8px 8px 0 0'

    // 각 company-record style, hover 적용해주기
    const videoDuration = this.videoData.video_time
    this.videoData.video_record.forEach((company, companyIndex) => {
      company.timelines.forEach((record, recordIndex) => {
        const recordElement = document.getElementById(`record-${companyIndex}-${recordIndex}`)
        recordElement.style.width = `${((record[2] - record[1]) / videoDuration) * 100}%`
        recordElement.style.left = `${(record[1] / videoDuration) * 100}%`
        const timestampInfo = document.getElementById('timestamp-info')
        const timestampDefault = document.getElementsByClassName('timestamp-default')
        recordElement.addEventListener('mouseover', () => {
          // text 바꿔주기
          let exposureText = ''
          if (record[0].length === 1) {
            if (record[0][0] === 'logo') {
              exposureText = '등장'
            } else if (record[0][0] === 'ody') {
              exposureText = 'Odyssey 노트북'
            } else {
              exposureText = '버즈 플러스'
            }
          } else {
            exposureText = '제품군 등장'
          }
          timestampInfo.innerText = `${company.company_id.company_name} ${exposureText}`
          timestampDefault.forEach(element => {
            element.style.opacity = 0.2
          })
        })
        recordElement.addEventListener('mouseout', () => {
          timestampInfo.innerText = ''
          timestampDefault.forEach(element => {
            element.style.opacity = 1
          })
        })
      })
    })
    this.changeShow()
    this.makeAllExposureTime()
  },

  methods: {
    ...mapActions('videoDetailStore', ['getVideoData', 'getRecommendVideoData', 'scrap']),

    scrapVideo: async function() {
      let answer
      if (this.show === true) {
        answer = confirm('스크랩 취소 하시겠습니까?')
      } else {
        answer = confirm('스크랩 하시겠습니까?')
      }
      if (answer) {
        await this.scrap(this.videoData._id)
        // 데이터 다시 받아오기
        await this.getVideoData(this.$route.params.video_youtube_id)
        this.changeShow()
      }
    },
    changeShow: function() {
      let flag = false
      for (const iterator of this.videoData.scrap_company_id) {
        if (iterator === this.company_id) {
          flag = true
          break
        }
      }
      if (flag) {
        this.show = true
      } else {
        this.show = false
      }
    },
    makePlayerObject: function(videoYoutubeId) {
      this.player = new window.YT.Player('yt-player', {
        videoId: this.videoData.video_youtube_id,
        playerVars: { controls: 1, modestbranding: 1, showinfo: 0 },
        events: {
          onReady: window.onPlayerReady
        }
      })
    },

    // 동영상 시간 이동하기
    playerSeekTo: function(seconds) {
      this.player.seekTo(seconds, true)
      this.player.playVideo()
    },

    // 동영상 재생하기
    videoPlay: function() {
      this.player.playVideo()
    },

    // 다른 동영상 페이지로 이동하기
    moveVideoDetailPage: function(videoYoutubeId) {
      router.push({ name: 'VideoDetail', params: { video_youtube_id: videoYoutubeId } })
    },

    // 채널 페이지로 이동하기
    moveChannelDetail(channerId) {
      router.push({ name: 'Channel', params: { channelId: channerId } })
    },

    // 채널 페이지로 이동하기
    moveYoutubeVideo(url) {
      window.open(url, '_blank')
    },

    // 해당 브랜드 선택하여 타임라인 자세히보기 & 취소하기
    choiceCompany: function(companyIndex, company) {
      if (this.focusedCompany === company) {
        // 선택된 company 선택 해제
        this.focusedCompany = false
        document.getElementById(
          `company-button-${companyIndex}`
        ).className = `company-button toggle-unselected selected-${companyIndex}`
      } else {
        // 선택한 company 이외에 toggle이 되어있는 경우 모두 style 해제
        for (let i = 0; i < Math.min(this.videoData.video_record.length, 5); i++) {
          document.getElementById(`company-button-${i}`).className = `company-button toggle-unselected selected-${i}`
        }
        // 선택한 company 스타일 적용
        this.focusedCompany = company
        document.getElementById(
          `company-button-${companyIndex}`
        ).className = `company-button toggle-selected background-${companyIndex}`
      }
    },

    // 초 => 00:00 형식으로 변경
    makeVideoTime: function(time) {
      const secNum = parseInt(time, 10)
      let hours = Math.floor(secNum / 3600)
      let minutes = Math.floor((secNum - hours * 3600) / 60)
      let seconds = secNum - hours * 3600 - minutes * 60

      if (hours < 10) {
        hours = '0' + hours
      }
      if (minutes < 10) {
        minutes = '0' + minutes
      }
      if (seconds < 10) {
        seconds = '0' + seconds
      }

      if (hours === '00') {
        return minutes + ':' + seconds
      } else {
        return hours + ':' + minutes + ':' + seconds
      }
    },

    // 구독자 단위 계산
    subscribeCnt(count) {
      if (count < 1000) return count + '명'
      else if (count < 10000) {
        count = parseInt(count / 1000)
        return count + '천명'
      } else {
        count = parseInt(count / 10000)
        return count + '만명'
      }
    },

    // 브랜드들의 총 노출시간 계산
    makeAllExposureTime: function() {
      let exposureTime = 0
      this.videoData.video_record.forEach(record => {
        exposureTime += record.total_exposure_time
      })
      this.allExposureTime = exposureTime
    }
  }
}
</script>

<style lang="scss" scoped>
@import '@/scss/VideoDetail/video_detail.scss';
@import '@/scss/common.scss';
</style>
