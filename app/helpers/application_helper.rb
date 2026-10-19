module ApplicationHelper
  # link_to that adds an "active" class when the current page matches.
  def nav_link_to(name, path, **opts)
    classes = [opts[:class], (current_page?(path) ? "active" : nil)].compact
    link_to name, path, opts.merge(class: classes.join(" "))
  end
end
