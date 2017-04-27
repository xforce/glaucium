package ginraymond

// RenderOptions is used to configure the renderer.
type RenderOptions struct {
	TemplateDir string
	ContentType string
}

// DefaultOptions constructs a RenderOptions struct with default settings.
func DefaultOptions() *RenderOptions {
	return &RenderOptions{
		TemplateDir: "templates",
		ContentType: "text/html; charset=utf-8",
	}
}
