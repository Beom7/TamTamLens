<template>
  <div class="card" v-if="len === 0">
    <div class="out">
      <div class="in">
        <i class="fa fa-exclamation-triangle fa-3x" aria-hidden="true"></i>
        <div class="out">영상이 없습니다.</div>
      </div>
    </div>
  </div>
  <div v-else class="card">
    <v-row no-gutters>
      <v-col class="pa-2" v-for="i in len" :key="i" cols="12" sm="3">
        <v-card class="data" outlined tile v-if="companyRecommendVideo[i - 1]">
          <a @click="moveVideoDetail(companyRecommendVideo[i - 1].video.video_youtube_id)">
            <v-img alt="user" :src="companyRecommendVideo[i - 1].video.video_thumbnails" />
          </a>
          <v-flex>
            <div class="data-title">
              {{ companyRecommendVideo[i - 1].video.video_title }}
            </div>
            <!-- <div class="data-subtitle">
              {{ companyRecommendVideo[i - 1].video.channel_id }}
            </div> -->
          </v-flex>
          <v-flex>
            <div class="data-subtitle pb-2">
              조회수
              {{ wathchCnt(companyRecommendVideo[i - 1].video.video_views) }}
            </div>
          </v-flex>
          <v-expand-transition>
            <v-card-text>
              <canvas :id="companyRecommendVideo[i - 1].video._id" />
            </v-card-text>
          </v-expand-transition>
        </v-card>
      </v-col>
    </v-row>
  </div>
</template>

<script>
import { mapState, mapActions } from 'vuex'
import Chart from 'chart.js'
import router from '@/router'
const searchStore = 'searchStore'
const _ = require('lodash')
export default {
  data: () => ({
    len: null,
    chartData: {
      type: 'doughnut',
      data: {
        labels: [],
        datasets: [
          {
            data: [],
            backgroundColor: []
          }
        ]
      },
      options: {
        responsive: true,
        legend: {
          position: 'right',
          align: 'center',
          labels: {
            boxWidth: 3,
            padding: 10,
            rtl: true
          }
        },
        maintainAspectRatio: false,
        animation: false,
        pieceLabel: { mode: 'value', position: 'inside', fontSize: 11, fontStyle: 'bold' },
        tooltips: {
          callbacks: {
            label: function(tooltipItem, data) {
              return data.labels[tooltipItem.index] + ': ' + data.datasets[0].data[tooltipItem.index] + '%'
            }
          }
        }
      }
    }
  }),
  async created() {
    await this.getCompanyRecommendVideo()
    this.len = this.companyRecommendVideo.length
    for (let i = 0; i < this.len; i++) {
      this.companyRecommendVideo[i].chartData = _.cloneDeep(this.chartData)
      this.companyRecommendVideo[i].chart = this.companyRecommendVideo[i].video._id
    }
    for (let i = 0; i < this.len; i++) {
      for (let j = 0; j < this.companyRecommendVideo[i].video.video_record.length; j++) {
        this.companyRecommendVideo[i].chartData.data.datasets[0].data.push(
          Math.round(
            (this.companyRecommendVideo[i].video.video_record[j].total_exposure_time /
              this.companyRecommendVideo[i].video.video_total) *
              100
          )
        )
        this.companyRecommendVideo[i].chartData.data.datasets[0].backgroundColor.push(this.dynamicColors())
        this.companyRecommendVideo[i].chartData.data.labels.push(
          this.companyRecommendVideo[i].video.video_record[j].company_id.company_name
        )
      }
    }
  },
  computed: {
    ...mapState(searchStore, ['companyRecommendVideo'])
  },
  updated() {
    for (let i = 0; i < this.len; i++) {
      this.createChart(this.companyRecommendVideo[i].chart, this.companyRecommendVideo[i].chartData)
    }
  },
  methods: {
    ...mapActions(searchStore, ['getCompanyRecommendVideo']),
    moveVideoDetail(id) {
      router.push({ name: 'VideoDetail', params: { video_youtube_id: id } })
    },
    dynamicColors() {
      const r = Math.floor(Math.random() * 255)
      const g = Math.floor(Math.random() * 255)
      const b = Math.floor(Math.random() * 255)
      return 'rgb(' + r + ',' + g + ',' + b + ')'
    },
    createChart(charId, chartData) {
      const ctx = document.getElementById(charId)
      const myChart = new Chart(ctx, {
        type: chartData.type,
        data: chartData.data,
        options: chartData.options
      })
      return myChart
    },
    wathchCnt(count) {
      if (count < 1000) return count + '회'
      else if (count < 10000) {
        count = parseInt(count / 1000)
        return count + '천회'
      } else {
        count = parseInt(count / 10000)
        return count + '만회'
      }
    }
  }
}
</script>

<style scoped>
.data {
  /* opacity: 0.7; */
  transition: all 0.6s;
  top: 0;
}
.data:hover {
  top: -10px;
  /* opacity: 1; */
}
.data-title {
  font-size: 0.85rem;
  overflow: hidden;
  text-overflow: ellipsis;
  display: -webkit-box;
  -webkit-line-clamp: 1;
  -webkit-box-orient: vertical;
  word-wrap: break-word;
  margin-top: 8px;
  margin-left: 8px;
}

.data-subtitle {
  font-size: 12px;
  margin-left: 8px;
  color: gray;
}
</style>
<style lang="scss" scoped>
@import '@/scss/myAnalysis.scss';
@import '@/scss/charts.scss';
</style>
