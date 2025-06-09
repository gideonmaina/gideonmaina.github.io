---
layout: '@layouts/Blog/BaseLayout.astro'
title: ESP32 SPI crashing issues
author: Gideon Maina
created: 2024-06-09 11:15:00Z
latitude: -1.29206590
longitude: 36.82194620
---


# ESP32-S3 crashing when using SPI pins.
![octal-flash-crash.png](/assets/blogs/hardware/esp32-s3/octal-flash-crash.png)

I encountered an issue with `ESP32-S3 N16R8` module when attempting to intergrate a `DHT22` sensor with other sensors. Normally, I run unit tests before intergration. So the DHT22 sensor was wired to `GPIO 36`  on a custom PCB and I used different libraries, like Adafruit DHT library, which all worked fine.

I then combined the DHT code with another codebase that ran a PM5003 particulate matter sensor and a GSM module to send the data. Now this where all trouble began. The particulate matter sensor and the GSM module both used **hardware serial** to communicate with the ESP32-S3. I did some trial and error like removing the GSM module feature and initiate DHT after initializing the PM sensor. At this point, everything was working fine. 

The GSM module was an integral part of the project so I had to bring back the feature. This time, I tried to use **software serial** but it crashed again at the moment the software serial instance is began. I too was literally crashing out 🤬. The only resolution was to tear everything apart.

![crash-screenshoot.png](/assets/blogs/hardware/esp32-s3/crash-screenshoot.png)


The first thing was to test with different DHT libraries out there. Every attempt failed spectacularly.

The next thing was to inspect the serial monitor at the point where the crashing occurred; *debug options were enabled*. I observed this line `rst: 0x8 (TG1WDT_SYS_RST), boot: 0x2a (SPI_FAST_FLASH_BOOT)`  and realized something right there! It all had to do with flash configurations. The ESP32-S3 variant I was using had an 8MB PSRAM. At that point I was using a configuration file by [4D systems](https/github.com/platformio/platform-espressif32/blob/master/boards/4d_systems_esp32s3_gen4_r8n16.json) that used a similar chip. A quick glance at the configuration file will show that the `memory_type` is set to `qio_opi` and `flash_mode` to `qio`.

To prove my theory that flash settings had something to do with the crashing, I tested out different configurations. 
![flash-mode-tests.png](public//assets/blogs/hardware/esp32-s3/flash-mode-tests.png)

From these results and consulting the [ESP32-S3 datasheet](https/www.espressif.com/sites/default/files/documentation/esp32-s3_datasheet_en.pdf), I created a custom board configuration that looks like this 👇🏼.

```json
{
  "build": {
    "arduino": {
      "ldscript": "esp32s3_out.ld",
      "memory_type": "qio_qspi",
      "partitions": "default_16MB.csv"
    },
    "core": "esp32",
    "extra_flags": [
      "-DBOARD_HAS_PSRAM",
      "-DARDUINO_USB_MODE=1",
      "-DARDUINO_USB_CDC_ON_BOOT=1",
      "-DARDUINO_RUNNING_CORE=1",
      "-DARDUINO_EVENT_RUNNING_CORE=1"
    ],
    "f_cpu": "240000000L",
    "f_flash": "80000000L",
    "flash_mode": "qio",
    "hwids": [
      ["0x303A", "0x1001"],
      ["0x10C4", "0XEA60"]
    ],
    "mcu": "esp32s3",
    "variant": "esp32_s3r8n16"
  },
  "connectivity": ["bluetooth", "wifi"],
  "debug": {
    "default_tool": "esp-builtin",
    "onboard_tools": ["esp-builtin"],
    "openocd_target": "esp32s3.cfg"
  },
  "frameworks": ["arduino", "espidf"],
  "name": "ESP32S3 QUECTEL V4 (ESP32S3-R8N16)",
  "upload": {
    "flash_size": "16MB",
    "maximum_ram_size": 8716288,
    "maximum_size": 16777216,
    "require_upload_port": true,
    "speed": 460800
  },
  "url": "https/docs.espressif.com/projects/esp-idf/en/latest/esp32s3/hw-reference/esp32s3/user-guide-devkitc-1.html",
  "vendor": "sensors.AFRICA"
}

```




I went all through this so you don't have too! Checkout the discussion I started about the same on [espressif github](https/github.com/espressif/arduino-esp32/discussions/11390).

Happy tinkering 😎!