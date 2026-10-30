using System.Text.Json;
using StreamUI.Contracts;
namespace StreamUI.Laplace;

public record LaplaceSettings(bool Enabled = false, string Url = "ws://localhost:9696", string Token = "", bool StartLocalBridge = false);
public sealed class LaplacePlugin : IStreamUIPlugin
{
    private LaplaceService? bridge;
    public async Task StartAsync(IPluginContext context, CancellationToken stopping)
    {
        var settings = context.Settings.Deserialize<LaplaceSettings>(new JsonSerializerOptions(JsonSerializerDefaults.Web)) ?? new();
        if (!Uri.TryCreate(settings.Url, UriKind.Absolute, out var uri) || uri.Scheme is not ("ws" or "wss"))
            throw new ArgumentException("弹幕地址应为 ws:// 或 wss:// 地址。");
        if (settings.StartLocalBridge && (!uri.IsLoopback || uri.Port != 9696 || uri.AbsolutePath != "/"))
            throw new ArgumentException("本地桥接使用 ws://localhost:9696。");
        bridge = new(context.DataDirectory);
        var messages = new ChatEvents();
        bridge.Changed += () => context.Publish("status", bridge.Status);
        bridge.Event += value => {
            if (messages.Normalize(value) is { } message) context.Publish("chat." + message.Kind, message);
            context.Publish("status", bridge.Status);
        };
        await bridge.Configure(settings); context.Publish("status", bridge.Status);
    }
    public async ValueTask DisposeAsync() { if (bridge is not null) await bridge.DisposeAsync(); }
}
