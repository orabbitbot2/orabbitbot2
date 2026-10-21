const { test, eq } = require("./_harness");
const {
  FEATURE_DEFAULTS,
  normalizeFeature,
} = require("../../src/systems/featuresService");
const { resolveGuildAntiSpamConfig } = require("../../src/systems/antiSpam");
const globalConfig = require("../../src/config/defaultConfig");

test("serverStats keeps all metrics enabled for existing guild configs", () => {
  const feature = normalizeFeature("serverStats", { enabled: true });
  eq(feature.showMembers, true);
  eq(feature.showJoins, true);
  eq(feature.showLeaves, true);
});

test("serverStats preserves independently disabled metrics", () => {
  const feature = normalizeFeature("serverStats", {
    showMembers: true,
    showJoins: false,
    showLeaves: false,
  });
  eq(feature.showMembers, true);
  eq(feature.showJoins, false);
  eq(feature.showLeaves, false);
});

test("antiSpam inherits current global defaults until a guild override exists", () => {
  const feature = normalizeFeature("antiSpam", null);
  eq(feature.enabled, globalConfig.antiSpam.enabled);
  eq(feature.maxMessages, globalConfig.antiSpam.maxMessages);
  eq(
    feature.intervalSeconds,
    Math.round(globalConfig.antiSpam.interval / 1000),
  );
});

test("antiSpam normalizes guild overrides and converts units at runtime", () => {
  const feature = normalizeFeature("antiSpam", {
    enabled: true,
    maxMessages: 4,
    intervalSeconds: 20,
    muteDurationMinutes: 8,
    actionCooldownSeconds: 30,
    softActionsEnabled: false,
    strikeWindowSeconds: 90,
    strikesToMute: 3,
    minLength: 4,
    similarityThreshold: 0.9,
    ignoreAttachments: false,
    bypassAdmins: true,
    sendMessage: false,
  });
  const runtime = resolveGuildAntiSpamConfig(globalConfig.antiSpam, feature);

  eq(runtime.enabled, true);
  eq(runtime.maxMessages, 4);
  eq(runtime.interval, 20_000);
  eq(runtime.muteDuration, 8 * 60_000);
  eq(runtime.actionCooldown, 30_000);
  eq(runtime.softActions.enabled, false);
  eq(runtime.softActions.strikeWindowMs, 90_000);
  eq(runtime.softActions.strikesToMute, 3);
  eq(runtime.channels, globalConfig.antiSpam.channels);
});

test("antiSpam feature defaults are inherited instead of duplicated", () => {
  eq(
    FEATURE_DEFAULTS.antiSpam.similarityThreshold,
    globalConfig.antiSpam.similarityThreshold,
  );
});
