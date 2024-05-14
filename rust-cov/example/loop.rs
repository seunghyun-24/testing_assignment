fn loop_func(fname: &str, arg: i32) -> Option<i32> {
    match fname {
        "sum" => Some(sum(arg)),
        "sumWhile" => Some(sum_while(arg)),
        "sumDoWhile" => Some(sum_do_while(arg)),
        "sumForIn" => Some(sum_for_in(arg)),
        "sumForOf" => Some(sum_for_of(arg)),
        "sumForRange" => Some(sum_for_range(arg)),
        _ => None,
    }
}

fn sum(x: i32) -> i32 {
    (1..=x).sum()
}

fn sum_while(mut x: i32) -> i32 {
    let mut s = 0;
    while x > 0 {
        s += x;
        x -= 1;
    }
    s
}

fn sum_do_while(mut x: i32) -> i32 {
    let mut s = 0;
    loop {
        s += x;
        x -= 1;
        if x <= 0 {
            break;
        }
    }
    s
}

fn sum_for_in(obj: &[i32]) -> i32 {
    let mut s = 0;
    for k in obj {
        s += k;
    }
    s
}

fn sum_for_of(array: &[i32]) -> i32 {
    let mut s = 0;
    for x in array {
        s += x;
    }
    s
}

fn sum_for_range(x: i32) -> i32 {
    let mut s = 0;
    for i in 0..x {
        s += i;
    }
    s
}